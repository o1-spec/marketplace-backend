import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import Product from "@/models/Product";
import Review from "@/models/Review";

export async function GET(request: NextRequest) {
  // console.log("🔍 [Profile] === REQUEST RECEIVED ===");
  // console.log("🔍 [Profile] Request URL:", request.url);
  // console.log("🔍 [Profile] Request method:", request.method);
  
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    // console.log("🔍 [Profile] Auth header:", authHeader ? "Present" : "Missing");
    // console.log("🔍 [Profile] Full auth header:", authHeader);
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // console.log("❌ [Profile] Invalid auth header format");
      return NextResponse.json(
        { error: "Authorization token required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    // console.log("🔑 [Profile] Full token:", token);
    // console.log("🔐 [Profile] JWT_SECRET exists:", !!process.env.JWT_SECRET);
    // console.log("🔐 [Profile] JWT_SECRET value:", process.env.JWT_SECRET);
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email?: string;
        temp?: boolean;
      };
      // console.log("✅ [Profile] Token verified successfully");
      // console.log("👤 [Profile] Decoded payload:", JSON.stringify(decoded, null, 2));
      
      // ✅ CRITICAL: Accept temp tokens
      if (decoded.temp) {
        console.log("⏰ [Profile] TEMPORARY TOKEN DETECTED - ALLOWING ACCESS");
      }
    } catch (error: any) {
      // console.error("❌ [Profile] Token verification failed:", error.message);
      // console.error("❌ [Profile] Error name:", error.name);
      // console.error("❌ [Profile] Token that failed:", token);
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // console.log("🔍 [Profile] Looking for user:", decoded.userId);
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      // console.error("❌ [Profile] User not found in database:", decoded.userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // console.log("✅ [Profile] User found:", {
    //   id: user._id,
    //   email: user.email,
    //   name: user.name,
    // });

    // Get stats
    const totalListings = await Product.countDocuments({
      sellerId: decoded.userId,
      isActive: true,
    });
    const totalSales = await Product.countDocuments({
      sellerId: decoded.userId,
      status: "sold",
    });
    const totalReviews = await Review.countDocuments({
      recipient: decoded.userId,
    });

    const reviews = await Review.find({ recipient: decoded.userId }).select(
      "rating"
    );
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          totalReviews
        : 0;

    const stats = {
      totalListings,
      totalSales,
      totalReviews,
      rating: Math.round(averageRating * 10) / 10,
    };

    // console.log("✅ [Profile] Returning profile data with stats:", stats);

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
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
  } catch (error: any) {
    // console.error("❌ [Profile] FATAL ERROR:", error.message);
    // console.error("❌ [Profile] Stack trace:", error.stack);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // console.log("🔍 [Profile PUT] === REQUEST RECEIVED ===");
  
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
      temp?: boolean;
    };

    // ✅ Allow temp tokens for profile updates
    if (decoded.temp) {
      console.log("⏰ [Profile PUT] Temporary token updating profile - ALLOWED");
    }

    const { avatar, bio, location, phoneNumber } = await request.json();

    if (bio && bio.length > 500) {
      return NextResponse.json(
        { error: "Bio must be less than 500 characters" },
        { status: 400 }
      );
    }

    if (phoneNumber && !/^\+?[\d\s\-\(\)]+$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

    const user = await User.findByIdAndUpdate(decoded.userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // console.log("✅ [Profile PUT] Profile updated successfully");

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        bio: user.bio || "",
        location: user.location || "",
        phoneNumber: user.phoneNumber || "",
        emailVerified: user.emailVerified,
      },
    });
  } catch (error: any) {
    // console.error("❌ [Profile PUT] Error:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}