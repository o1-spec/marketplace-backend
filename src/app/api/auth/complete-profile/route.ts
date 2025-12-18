import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { sendProfileCompleteEmail } from "@/lib/email";
import Notification from "@/models/Notification";

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { phoneNumber, location, bio, avatar } = await request.json();

    if (phoneNumber && phoneNumber.length < 10) {
      return NextResponse.json(
        { error: "Phone number must be at least 10 digits" },
        { status: 400 }
      );
    }

    if (location && location.length < 3) {
      return NextResponse.json(
        { error: "Location must be at least 3 characters" },
        { status: 400 }
      );
    }

    if (bio && bio.length > 150) {
      return NextResponse.json(
        { error: "Bio cannot exceed 150 characters" },
        { status: 400 }
      );
    }
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
    if (location !== undefined) user.location = location;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    const wasIncomplete =
      !user.phoneNumber || !user.location || !user.bio || !user.avatar;
    await user.save();

    const isNowComplete =
      user.phoneNumber && user.location && user.bio && user.avatar;
    if (wasIncomplete && isNowComplete) {
      const emailResult = await sendProfileCompleteEmail(user.email, user.name);
      if (!emailResult.success) {
        console.error("Failed to send completion email:", emailResult.error);
      }

      await Notification.create({
        userId: user._id,
        type: "system",
        title: "Profile Completed!",
        message:
          "Your profile has been successfully completed. You can now start buying and selling!",
        read: false,
      });
    }
    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          avatar: user.avatar,
          phoneNumber: user.phoneNumber,
          location: user.location,
          bio: user.bio,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
