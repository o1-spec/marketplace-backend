const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./mongodb'); // Fixed path
const Conversation = require('../models/Conversation'); // Fixed path
const Message = require('../models/Message'); // Fixed path

const onlineUsers = new Map();

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket, next) => {
    try {
      await connectDB();
      
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    
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
            (p) => p.toString() !== socket.userId
          );
          
          otherParticipants.forEach((participantId) => {
            const existingCount = conversation.unreadCounts.find(
              (uc) => uc.userId.toString() === participantId
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
        
        fullConversation.participants.forEach((participant) => {
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
          (uc) => uc.userId.toString() === socket.userId
        );

        if (unreadCountIndex !== -1) {
          conversation.unreadCounts[unreadCountIndex].count = 0;
          await conversation.save();
        }

        const otherParticipants = conversation.participants.filter(
          (p) => p.toString() !== socket.userId
        );

        otherParticipants.forEach((participantId) => {
          io.to(participantId).emit('messagesRead', {
            conversationId: data.conversationId,
            userId: socket.userId
          });
        });
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    });

    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
    });

    socket.on('leaveConversation', (conversationId) => {
      socket.leave(conversationId);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', userId);
      onlineUsers.delete(userId);
      notifyUserStatus(userId, false);
    });
  });

  async function notifyUserStatus(userId, isOnline) {
    try {
      const conversations = await Conversation.find({
        participants: userId
      });

      const contactIds = new Set();
      conversations.forEach(conv => {
        conv.participants.forEach((participant) => {
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

function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

module.exports = { initSocket, isUserOnline };