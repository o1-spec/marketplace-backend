import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product, { IProduct } from "@/models/Product";
import User from "@/models/User";  
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Authenticate user
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

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all'; // active, sold, inactive, all
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const sortBy = url.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    let query: any = { sellerId: decoded.userId };
    if (status !== 'all') {
      query.status = status;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    const total = await Product.countDocuments(query);

    // Calculate stats
    const stats = await Product.aggregate([
      { $match: { sellerId: decoded.userId } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          activeListings: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          },
          soldListings: {
            $sum: { $cond: [{ $eq: ["$status", "sold"] }, 1, 0] }
          },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: "$likes" },
        }
      }
    ]);

    const userStats = stats[0] || {
      totalListings: 0,
      activeListings: 0,
      soldListings: 0,
      totalViews: 0,
      totalLikes: 0,
    };

    return NextResponse.json({
      products: products.map(product => {
        // Calculate discount manually
        const discountPercentage = product.originalPrice && product.originalPrice > product.price
          ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
          : 0;

        return {
          id: product._id.toString(),
          title: product.title,
          description: product.description,
          price: product.price,
          originalPrice: product.originalPrice,
          category: product.category,
          subcategory: product.subcategory,
          condition: product.condition,
          brand: product.brand,
          modelNumber: product.modelNumber,
          size: product.size,
          color: product.color,
          images: product.images,
          videoUrl: product.videoUrl,
          location: product.location,
          shippingAvailable: product.shippingAvailable,
          shippingCost: product.shippingCost,
          pickupOnly: product.pickupOnly,
          status: product.status,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          isNegotiable: product.isNegotiable,
          views: product.views,
          likes: product.likes,
          shares: product.shares,
          favorites: product.favorites,
          tags: product.tags,
          discountPercentage,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          publishedAt: product.publishedAt,
          soldAt: product.soldAt,
        };
      }),
      stats: userStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get my listings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}