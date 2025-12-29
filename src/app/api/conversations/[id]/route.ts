// src/app/api/conversations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Product from "@/models/Product";
import jwt from "jsonwebtoken";
import { isUserOnline } from "@/lib/socket";
import Conversation from "@/models/Conversation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: conversationId } = await params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: decoded.userId,
    })
      .populate("productId", "title images price")
      .populate("participants", "name avatar");

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Get the other participant
    const otherParticipant = (conversation.participants as any[]).find(
      (p: any) => p._id.toString() !== decoded.userId
    );

    if (!otherParticipant) {
      return NextResponse.json(
        { error: "Other participant not found" },
        { status: 404 }
      );
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
          id: otherParticipant._id,
          name: otherParticipant.name,
          avatar: otherParticipant.avatar,
          isOnline: isUserOnline(otherParticipant._id.toString()),
        },
      },
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}