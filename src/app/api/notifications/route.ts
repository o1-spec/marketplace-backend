import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Notification, { INotification } from "@/models/Notification";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

interface PopulatedNotification
  extends Omit<INotification, "relatedUserId" | "relatedProductId"> {
  relatedUserId?: {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
  };
  relatedProductId?: {
    _id: mongoose.Types.ObjectId;
    title: string;
    images?: string[];
  };
}

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

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const filter = url.searchParams.get("filter");

    const query: any = { userId: decoded.userId };
    if (filter === "unread") {
      query.read = false;
    }

    const notifications = (await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate("relatedUserId", "name avatar")
      .populate("relatedProductId", "title images")
      .lean()) as PopulatedNotification[];

    const total = await Notification.countDocuments(query);

    const transformedNotifications = notifications.map((notification) => ({
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      time: getTimeAgo(notification.createdAt),
      read: notification.read,
      avatar:
        notification.avatar || (notification.relatedUserId as any)?.avatar,
      productImage:
        notification.productImage ||
        (notification.relatedProductId as any)?.images?.[0],
      actionId: notification.actionId,
    }));

    return NextResponse.json({
      notifications: transformedNotifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
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
      type,
      title,
      message,
      recipientId,
      avatar,
      productImage,
      actionId,
      relatedUserId,
      relatedProductId,
    } = await request.json();

    // Validate required fields
    if (!type || !title || !message || !recipientId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const notification = await Notification.create({
      userId: recipientId,
      type,
      title,
      message,
      avatar,
      productImage,
      actionId,
      relatedUserId,
      relatedProductId,
    });

    return NextResponse.json(
      { message: "Notification created", notification },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}
