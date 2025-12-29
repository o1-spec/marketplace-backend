import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Review from "@/models/Review";
import Product from "@/models/Product";
import jwt from "jsonwebtoken";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");
    const productId = searchParams.get("productId");
    const userId = searchParams.get("userId");

    if (!sellerId && !productId && !userId) {
      return NextResponse.json(
        { error: "sellerId, productId, or userId parameter is required" },
        { status: 400 }
      );
    }

    let query = {};
    let populateFields = ['reviewer'];

    if (sellerId) {
      query = { recipient: sellerId };
    } else if (productId) {
      query = { product: productId };
    } else if (userId) {
      query = { 
        $or: [
          { recipient: userId }, 
          { reviewer: userId }   
        ]
      };
      populateFields.push('product'); 
    }

    const reviews = await Review.find(query)
      .populate(populateFields.join(' '))
      .sort({ createdAt: -1 })
      .lean();

    const formattedReviews = reviews.map(review => ({
      id: review._id.toString(),
      reviewer: {
        name: review.reviewer?.name || 'Unknown',
        avatar: review.reviewer?.avatar || "",
      },
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      ...(review.product && {
        product: {
          id: review.product._id.toString(),
          title: review.product.title,
          image: review.product.images?.[0] || "",
        },
      }),
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      total: formattedReviews.length,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { sellerId, productId, rating, comment, orderId } = body;

    // Validate required fields
    if (!rating || !comment) {
      return NextResponse.json(
        { error: "rating and comment are required" },
        { status: 400 }
      );
    }

    if (!sellerId && !productId) {
      return NextResponse.json(
        { error: "Either sellerId or productId is required" },
        { status: 400 }
      );
    }

    let reviewData: any = {
      reviewer: decoded.userId,
      rating,
      comment,
      orderId,
      isVerified: !!orderId,
    };

    if (sellerId) {
      // Seller review
      reviewData.recipient = sellerId;
      
      // Check if user already reviewed this seller
      const existingReview = await Review.findOne({
        reviewer: decoded.userId,
        recipient: sellerId,
      });

      if (existingReview) {
        return NextResponse.json(
          { error: "You have already reviewed this seller" },
          { status: 400 }
        );
      }
    } else if (productId) {
      // Product review
      reviewData.product = productId;
      
      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Check if user already reviewed this product
      const existingReview = await Review.findOne({
        reviewer: decoded.userId,
        product: productId,
      });

      if (existingReview) {
        return NextResponse.json(
          { error: "You have already reviewed this product" },
          { status: 400 }
        );
      }
    }

    // Create review
    const review = new Review(reviewData);
    await review.save();

    // Update seller rating if it's a seller review
    if (sellerId) {
      const sellerReviews = await Review.find({ recipient: sellerId });
      const averageRating = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
      
      // Update User model with rating
      await User.findByIdAndUpdate(sellerId, {
        rating: averageRating,
        totalReviews: sellerReviews.length,
      });
    }

    return NextResponse.json({
      message: "Review created successfully",
      review: {
        id: review._id.toString(),
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      },
    });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json(
        { error: "reviewId parameter is required" },
        { status: 400 }
      );
    }

    // Find the review and check ownership
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      );
    }

    if (review.reviewer.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: "You can only delete your own reviews" },
        { status: 403 }
      );
    }

    await Review.findByIdAndDelete(reviewId);

    return NextResponse.json({
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}