import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import jwt from "jsonwebtoken";

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
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const messages = await Message.find({
      conversationId,
    })
      .populate("senderId", "name avatar")
      .sort({ createdAt: 1 });

    return NextResponse.json({
      messages: messages.map((msg) => ({
        id: msg._id,
        text: msg.content,
        senderId: msg.senderId._id,
        timestamp: msg.createdAt.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        isRead: msg.status === "read",
      })),
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}