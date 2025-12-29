import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  recipient?: mongoose.Types.ObjectId; 
  reviewer: mongoose.Types.ObjectId; 
  product?: mongoose.Types.ObjectId;  
  rating: number; 
  comment: string;
  orderId?: string; 
  isVerified: boolean; 
  createdAt: Date;
  updatedAt: Date;
}

// src/models/Review.ts
const ReviewSchema = new Schema<IReview>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
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
      required: false, 
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
      trim: true,
    },
    orderId: {
      type: String,
      trim: true,
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
  { reviewer: 1, recipient: 1 },
  { 
    unique: true, 
    partialFilterExpression: { recipient: { $exists: true } },
    name: "unique_reviewer_recipient" 
  }
);

ReviewSchema.index(
  { reviewer: 1, product: 1 },
  { 
    unique: true, 
    partialFilterExpression: { product: { $exists: true } },
    name: "unique_reviewer_product" 
  }
); 

ReviewSchema.pre('save' as any, function(this: IReview, next: (err?: any) => void) {
  if (!this.recipient && !this.product) {
    return next(new Error('Either recipient or product must be provided'));
  }
  if (this.recipient && this.product) {
    return next(new Error('Cannot have both recipient and product - choose one'));
  }
  return next();
});

export default mongoose.models.Review ||
  mongoose.model<IReview>("Review", ReviewSchema);