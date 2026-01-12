import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product, { IProduct } from "@/models/Product";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "@/models/User";  

// Type for populated product
interface PopulatedProduct extends Omit<IProduct, "sellerId"> {
  sellerId: {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
    phoneNumber?: string;
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
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const products = (await Product.find(query)
      .populate<{
        sellerId: {
          _id: mongoose.Types.ObjectId;
          name: string;
          avatar?: string;
          phoneNumber?: string;
        };
      }>("sellerId", "name avatar")
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean()) as unknown as PopulatedProduct[];

    const total = await Product.countDocuments(query);

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
          sellerId: product.sellerId._id.toString(),
          seller: {
            name: product.sellerId.name,
            avatar: product.sellerId.avatar,
            phoneNumber: product.sellerId.phoneNumber,
          },
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

    // ✅ Populate seller details before returning
    const populatedProduct = await Product.findById(product._id)
      .populate("sellerId", "name avatar phoneNumber")
      .lean();

    // Calculate discount
    const discountPercentage =
      populatedProduct!.originalPrice && populatedProduct!.originalPrice > populatedProduct!.price
        ? Math.round(
            ((populatedProduct!.originalPrice - populatedProduct!.price) /
              populatedProduct!.originalPrice) *
              100
          )
        : 0;

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: {
          id: populatedProduct!._id.toString(),
          title: populatedProduct!.title,
          description: populatedProduct!.description,
          price: populatedProduct!.price,
          originalPrice: populatedProduct!.originalPrice,
          category: populatedProduct!.category,
          subcategory: populatedProduct!.subcategory,
          condition: populatedProduct!.condition,
          brand: populatedProduct!.brand,
          modelNumber: populatedProduct!.modelNumber,
          size: populatedProduct!.size,
          color: populatedProduct!.color,
          images: populatedProduct!.images,
          videoUrl: populatedProduct!.videoUrl,
          location: populatedProduct!.location,
          shippingAvailable: populatedProduct!.shippingAvailable,
          shippingCost: populatedProduct!.shippingCost,
          pickupOnly: populatedProduct!.pickupOnly,
          sellerId: (populatedProduct!.sellerId as any)._id.toString(),
          seller: {
            name: (populatedProduct!.sellerId as any).name,
            avatar: (populatedProduct!.sellerId as any).avatar,
            phoneNumber: (populatedProduct!.sellerId as any).phoneNumber,
          },
          status: populatedProduct!.status,
          isActive: populatedProduct!.isActive,
          isFeatured: populatedProduct!.isFeatured,
          isNegotiable: populatedProduct!.isNegotiable,
          views: populatedProduct!.views,
          likes: populatedProduct!.likes,
          shares: populatedProduct!.shares,
          favorites: populatedProduct!.favorites,
          tags: populatedProduct!.tags,
          attributes: populatedProduct!.attributes,
          discountPercentage,
          createdAt: populatedProduct!.createdAt,
          updatedAt: populatedProduct!.updatedAt,
          publishedAt: populatedProduct!.publishedAt,
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