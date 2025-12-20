import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  recipient: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId; 
  product: mongoose.Types.ObjectId; 
  rating: number; 
  comment: string;
  orderId?: mongoose.Types.ObjectId; 
  isVerified: boolean; 
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order", 
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

ReviewSchema.index({ recipient: 1, createdAt: -1 });
ReviewSchema.index({ reviewer: 1, createdAt: -1 });
ReviewSchema.index({ product: 1, createdAt: -1 });

ReviewSchema.index(
  { reviewer: 1, product: 1 },
  { unique: true, name: "unique_reviewer_product" }
);

export default mongoose.models.Review ||
  mongoose.model<IReview>("Review", ReviewSchema);