import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User"; 
import Product from "@/models/Product"; // ✅ Then Product (references User)
import Conversation from "@/models/Conversation"; // ✅ Then Conversation (references Product)
import Message from "@/models/Message";
import jwt from "jsonwebtoken";
import { isUserOnline } from "@/lib/socket";

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

    const conversations = await Conversation.find({
      participants: decoded.userId,
    })
      .populate("productId", "title images price")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participants.find(
          (p: any) => p.toString() !== decoded.userId
        );

        const otherUser = otherParticipantId
          ? await User.findById(otherParticipantId).select("name avatar")
          : null;

        const unreadCount =
          conv.unreadCounts.find(
            (uc: any) => uc.userId.toString() === decoded.userId
          )?.count || 0;

        return {
          id: conv._id,
          userId: otherParticipantId,
          userName: otherUser?.name || "Unknown User",
          userAvatar: otherUser?.avatar || "",
          productId: (conv.productId as any)._id,
          productTitle: (conv.productId as any).title,
          productImage: (conv.productId as any).images?.[0] || "",
          lastMessage: (conv.lastMessage as any)?.content || "",
          lastMessageTime: (conv.lastMessage as any)?.createdAt || conv.createdAt,
          unreadCount,
          isOnline: otherParticipantId ? isUserOnline(otherParticipantId.toString()) : false,
        };
      })
    );

    return NextResponse.json({
      conversations: formattedConversations.map((conv) => ({
        ...conv,
        productImage: conv.productImage,
      })),
    });
  } catch (error) {
    console.error("Get conversations error:", error);
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

    const { productId, sellerId } = await request.json();

    if (!productId || !sellerId) {
      return NextResponse.json(
        { error: "Product ID and seller ID are required" },
        { status: 400 }
      );
    }

    let conversation = await Conversation.findOne({
      productId,
      participants: { $all: [decoded.userId, sellerId] },
    }).populate("productId", "title images price");

    if (!conversation) {
      conversation = new Conversation({
        productId,
        participants: [decoded.userId, sellerId],
        unreadCounts: [
          { userId: decoded.userId, count: 0 },
          { userId: sellerId, count: 0 },
        ],
      });

      await conversation.save();
      await conversation.populate("productId", "title images price");
    }

    const seller = await User.findById(sellerId).select("name avatar");

    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    return NextResponse.json({
      conversation: {
        id: conversation._id,
        product: {
          id: (conversation.productId as any)._id,
          title: (conversation.productId as any).title,
          image: (conversation.productId as any).images?.[0] || "",
          price: (conversation.productId as any).price,
        },
        user: {
          id: seller._id,
          name: seller.name,
          avatar: seller.avatar,
        },
      },
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}