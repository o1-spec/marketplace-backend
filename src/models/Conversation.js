// src/models/Conversation.js
const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  unreadCounts: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  ],
}, {
  timestamps: true,
});

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ productId: 1 });
ConversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);