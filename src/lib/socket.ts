import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import connectDB from './mongodb.js';  // Use .js extension for ES modules
import Conversation from '../models/Conversation.js';  // Use .js extension
import Message from '../models/Message.js';  // Use .js extension

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

const onlineUsers = new Map<string, string>();

export function initSocket(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      await connectDB();
      
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    
    onlineUsers.set(userId, socket.id);
    notifyUserStatus(userId, true);
    
    console.log('User connected:', userId);
    socket.join(userId);

    socket.on('sendMessage', async (data) => {
      try {
        await connectDB();
        
        const message = new Message({
          conversationId: data.conversationId,
          senderId: socket.userId,
          content: data.content,
          type: 'text'
        });
        
        await message.save();

        const conversation = await Conversation.findById(data.conversationId);
        if (conversation) {
          conversation.lastMessage = message._id;
          conversation.updatedAt = new Date();
          
          const otherParticipants = conversation.participants.filter(
            (p: any) => p.toString() !== socket.userId
          );
          
          otherParticipants.forEach((participantId: any) => {
            const participantIdStr = participantId.toString();
            const existingCount = conversation.unreadCounts.find(
              (uc: any) => uc.userId.toString() === participantIdStr
            );
            
            if (existingCount) {
              existingCount.count += 1;
            } else {
              conversation.unreadCounts.push({
                userId: participantId,
                count: 1
              });
            }
          });
          
          await conversation.save();
        }

        await message.populate('senderId', 'name avatar');
        
        const fullConversation = await Conversation.findById(data.conversationId)
          .populate('participants');
        
        if (fullConversation && Array.isArray(fullConversation.participants)) {
          fullConversation.participants.forEach((participant: any) => {
            io.to(participant._id.toString()).emit('message', {
              id: message._id,
              text: message.content,
              senderId: message.senderId,
              timestamp: new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              }),
              isRead: false,
              conversationId: data.conversationId
            });
          });
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('markAsRead', async (data) => {
      try {
        await connectDB();
        
        const conversation = await Conversation.findById(data.conversationId);
        if (!conversation) return;

        await Message.updateMany(
          {
            conversationId: data.conversationId,
            senderId: { $ne: socket.userId },
            status: { $ne: 'read' }
          },
          {
            status: 'read',
            $push: {
              readBy: {
                userId: socket.userId,
                readAt: new Date()
              }
            }
          }
        );

        const unreadCountIndex = conversation.unreadCounts.findIndex(
          (uc: any) => uc.userId.toString() === socket.userId
        );

        if (unreadCountIndex !== -1) {
          conversation.unreadCounts[unreadCountIndex].count = 0;
          await conversation.save();
        }
        const otherParticipants = conversation.participants.filter(
          (p: any) => p.toString() !== socket.userId
        );

        otherParticipants.forEach((participantId: any) => {
          io.to(participantId.toString()).emit('messagesRead', {
            conversationId: data.conversationId,
            userId: socket.userId
          });
        });
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    });

    socket.on('joinConversation', (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on('leaveConversation', (conversationId: string) => {
      socket.leave(conversationId);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', userId);
      onlineUsers.delete(userId);
      notifyUserStatus(userId, false);
    });
  });

  async function notifyUserStatus(userId: string, isOnline: boolean) {
    try {
      const conversations = await Conversation.find({
        participants: userId
      });

      const contactIds = new Set<string>();
      conversations.forEach(conv => {
        conv.participants.forEach((participant: any) => {
          if (participant.toString() !== userId) {
            contactIds.add(participant.toString());
          }
        });
      });

      contactIds.forEach(contactId => {
        io.to(contactId).emit('userStatus', {
          userId,
          isOnline
        });
      });
    } catch (error) {
      console.error('Error notifying user status:', error);
    }
  }

  return io;
}

export function isUserOnline(userId: string) {
  return onlineUsers.has(userId);
}