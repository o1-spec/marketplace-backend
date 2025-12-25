import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product, { IProduct } from "@/models/Product";
import Review from "@/models/Review"; 
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

interface PopulatedProduct extends Omit<IProduct, "sellerId"> {
  sellerId: {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const category = url.searchParams.get("category");
    const userId = url.searchParams.get("userId");
    const status = url.searchParams.get("status") || "active";
    const search = url.searchParams.get("search");
    const minPrice = url.searchParams.get("minPrice");
    const maxPrice = url.searchParams.get("maxPrice");
    const condition = url.searchParams.get("condition");
    const location = url.searchParams.get("location");
    const sortBy = url.searchParams.get("sortBy") || "createdAt";
    const sortOrder = url.searchParams.get("sortOrder") || "desc";
    const excludeId = url.searchParams.get("excludeId");

    let query: any = { status };
    if (category) query.category = category;
    if (userId) query.sellerId = userId;
    if (condition) query.condition = condition;
    if (location) {
      query["location.city"] = new RegExp(location, "i");
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    if (search) {
      query.$text = { $search: search };
    }
    if (excludeId) query._id = { $ne: new mongoose.Types.ObjectId(excludeId) };

    query.sellerId = { $exists: true, $ne: null };

    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const products = (await Product.find(query)
      .populate<{
        sellerId: {
          _id: mongoose.Types.ObjectId;
          name: string;
          avatar?: string;
        };
      }>("sellerId", "name avatar")
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()) as unknown as PopulatedProduct[];

    const total = await Product.countDocuments(query);

    const productIds = products.map(p => p._id);
    const reviewStats = await Review.aggregate([
      { $match: { product: { $in: productIds } } },
      {
        $group: {
          _id: "$product",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    const reviewStatsMap = new Map();
    reviewStats.forEach(stat => {
      reviewStatsMap.set(stat._id.toString(), {
        averageRating: Math.round(stat.averageRating * 10) / 10, 
        reviewCount: stat.reviewCount
      });
    });

    return NextResponse.json({
      products: products.map((product: PopulatedProduct) => {
        // Calculate discount manually
        const discountPercentage =
          product.originalPrice && product.originalPrice > product.price
            ? Math.round(
                ((product.originalPrice - product.price) /
                  product.originalPrice) *
                  100
              )
            : 0;

        const reviewData = reviewStatsMap.get(product._id.toString()) || {
          averageRating: 0,
          reviewCount: 0
        };

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
          sellerId: product.sellerId?._id?.toString() || '',
          seller: product.sellerId ? { 
            name: product.sellerId.name,
            avatar: product.sellerId.avatar,
          } : null,
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
          averageRating: reviewData.averageRating,
          reviewCount: reviewData.reviewCount,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          publishedAt: product.publishedAt,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get products error:", error);
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

    const {
      title,
      description,
      price,
      originalPrice,
      category,
      subcategory,
      condition,
      brand,
      modelNumber,
      size,
      color,
      images,
      videoUrl,
      location,
      shippingAvailable,
      shippingCost,
      pickupOnly,
      isNegotiable,
      tags,
      attributes,
    } = await request.json();

    if (
      !title ||
      !description ||
      !price ||
      !category ||
      !condition ||
      !location?.city ||
      !location?.state
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const product = await Product.create({
      title,
      description,
      price,
      originalPrice,
      category,
      subcategory,
      condition,
      brand,
      modelNumber,
      size,
      color,
      images: images || [],
      videoUrl,
      location,
      shippingAvailable: shippingAvailable || false,
      shippingCost,
      pickupOnly: pickupOnly || false,
      sellerId: decoded.userId,
      isNegotiable: isNegotiable || false,
      tags: tags || [],
      attributes: attributes || {},
    });

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: {
          id: product._id.toString(),
          ...product.toObject(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}