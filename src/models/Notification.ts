import mongoose, { Document, Model } from "mongoose";

export type NotificationType =
  | 'message'
  | 'like'
  | 'offer'
  | 'purchase'
  | 'follow'
  | 'review'
  | 'system';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  avatar?: string;
  productImage?: string;
  actionId?: string;
  relatedUserId?: mongoose.Types.ObjectId;
  relatedProductId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['message', 'like', 'offer', 'purchase', 'follow', 'review', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      trim: true,
    },
    productImage: {
      type: String,
      trim: true,
    },
    actionId: {
      type: String,
      trim: true,
    },
    relatedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    relatedProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', 
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, read: 1 });

const Notification: Model<INotification> =
  mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;