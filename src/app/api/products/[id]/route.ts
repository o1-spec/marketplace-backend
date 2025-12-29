import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product, { IProduct } from "@/models/Product";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

interface PopulatedProduct extends Omit<IProduct, "sellerId"> {
  sellerId: {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
    bio?: string;
    phoneNumber?: string;
    emailVerified?: boolean;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { id } = await params;

 const product = await Product.findById(id)
  .setOptions({ strictPopulate: false })
  .populate('sellerId', 'name avatar bio phoneNumber emailVerified') 
  .lean() as PopulatedProduct | null;

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    console.log("✅ Backend: Product found:", product._id);

    await Product.findByIdAndUpdate(id, { $inc: { views: 1 } });

    const discountPercentage =
      product.originalPrice && product.originalPrice > product.price
        ? Math.round(
            ((product.originalPrice - product.price) / product.originalPrice) *
              100
          )
        : 0;

    return NextResponse.json({
      product: {
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
        seller: {
          id: product.sellerId._id.toString(),
          name: product.sellerId.name,
          avatar: product.sellerId.avatar,
          bio: product.sellerId.bio,
          phoneNumber: product.sellerId.phoneNumber,
          emailVerified: product.sellerId.emailVerified,
        },
        status: product.status,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
        isNegotiable: product.isNegotiable,
        views: product.views + 1,
        likes: product.likes,
        shares: product.shares,
        favorites: product.favorites,
        tags: product.tags,
        attributes: product.attributes,
        discountPercentage,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        publishedAt: product.publishedAt,
      },
    });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params;

    const product = await Product.findOne({
  _id: id,
  sellerId: decoded.userId, 
});

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or unauthorized" },
        { status: 404 }
      );
    }

    const updateData = await request.json();

    Object.assign(product, updateData);
    await product.save();

    return NextResponse.json({
      message: "Product updated successfully",
      product: {
        id: product._id.toString(),
        ...product.toObject(),
      },
    });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params;

    const product = await Product.findOneAndDelete({
      _id: id,
      sellerId: decoded.userId,
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
