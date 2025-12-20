import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
import Review from "@/models/Review";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = await params;

    const user = await User.findById(id).select('-password');
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalListings = await Product.countDocuments({ 
      sellerId: id,
      isActive: true 
    });
    const totalSales = await Product.countDocuments({ 
      sellerId: id, 
      status: 'sold' 
    });
    const totalReviews = await Review.countDocuments({ recipient: id });

    const reviews = await Review.find({ recipient: id }).select('rating');
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const stats = {
      totalListings,
      totalSales,
      totalReviews,
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
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
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}