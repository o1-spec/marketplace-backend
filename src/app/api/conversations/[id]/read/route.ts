import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import jwt from "jsonwebtoken";

export async function POST(
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

    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: decoded.userId },
        status: { $ne: 'read' }
      },
      {
        status: 'read',
        $push: {
          readBy: {
            userId: decoded.userId,
            readAt: new Date()
          }
        }
      }
    );

    const unreadCountIndex = conversation.unreadCounts.findIndex(
      (uc: any) => uc.userId.toString() === decoded.userId
    );

    if (unreadCountIndex !== -1) {
      conversation.unreadCounts[unreadCountIndex].count = 0;
      await conversation.save();
    }

    const otherParticipants = conversation.participants.filter(
      (p: any) => p.toString() !== decoded.userId
    );

    if ((global as any).io) {
      otherParticipants.forEach((participantId: string) => {
        (global as any).io.to(participantId).emit('messagesRead', {
          conversationId,
          userId: decoded.userId
        });
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}