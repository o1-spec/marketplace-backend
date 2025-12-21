import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Favorite from '@/models/Favorite';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const favorites = await Favorite.find({ userId: decoded.userId })
      .populate('productId')
      .sort({ createdAt: -1 });

    const favoriteProducts = favorites.map(fav => ({
      id: fav.productId._id.toString(),
      title: fav.productId.title,
      price: fav.productId.price,
      image: fav.productId.images[0],
      location: fav.productId.location.city,
      condition: fav.productId.condition,
    }));

    return NextResponse.json({ favorites: favoriteProducts });
  } catch (error) {
    console.error('Get favorites error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: decoded.userId,
      productId,
    });

    if (existingFavorite) {
      return NextResponse.json({ error: 'Product already in favorites' }, { status: 400 });
    }

    const favorite = new Favorite({
      userId: decoded.userId,
      productId,
    });

    await favorite.save();

    return NextResponse.json({ message: 'Product added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization token required' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    await Favorite.findOneAndDelete({
      userId: decoded.userId,
      productId,
    });

    return NextResponse.json({ message: 'Product removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}