import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/mongodb";
import Conversation from "@/models/Conversation";
import Message from "@/models/Message";
import { addOnlineUser, removeOnlineUser } from "./onlineUsers";


interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function initSocket(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      await connectDB();
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Auth error"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };

      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Auth error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    addOnlineUser(userId, socket.id);

    socket.on("disconnect", () => {
      removeOnlineUser(userId);
    });
  });

  return io;
}
