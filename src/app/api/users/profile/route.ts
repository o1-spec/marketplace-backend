import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate stats (you'll need to implement these)
    const stats = {
      totalListings: 0, // Count user's products
      totalSales: 0, // Count sold products
      rating: 0, // Average rating from reviews
      totalReviews: 0, // Count reviews
    };

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        bio: user.bio || "",
        location: user.location || "",
        phoneNumber: user.phoneNumber || "",
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        ...stats,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    const body = await request.json();

    // Validate input (optional but recommended)
    const allowedFields = ['name', 'email', 'bio', 'location', 'phoneNumber', 'avatar'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(decoded.userId, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate stats (reuse from GET)
    const stats = {
      totalListings: 0, // Count user's products
      totalSales: 0, // Count sold products
      rating: 0, // Average rating from reviews
      totalReviews: 0, // Count reviews
    };

    return NextResponse.json({
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar || "",
        bio: updatedUser.bio || "",
        location: updatedUser.location || "",
        phoneNumber: updatedUser.phoneNumber || "",
        emailVerified: updatedUser.emailVerified,
        createdAt: updatedUser.createdAt,
        ...stats,
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);

    if (error.name === 'ValidationError') {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 });
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}