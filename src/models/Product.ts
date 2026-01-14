import mongoose, { Document, Model } from "mongoose";

export type ProductCondition = "new" | "like_new" | "good" | "fair" | "poor";
export type ProductStatus =
  | "active"
  | "sold"
  | "inactive"
  | "pending"
  | "suspended";

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;

  // Basic Information
  title: string;
  description: string;
  price: number;
  originalPrice?: number; // For discounts

  // Categorization
  category: string;
  subcategory?: string;

  // Product Details
  condition: ProductCondition;
  brand?: string;
  modelNumber?: string; // ✅ RENAMED FROM 'model'
  size?: string; // For clothing/shoes
  color?: string;

  // Media
  images: string[]; // Array of Cloudinary URLs
  videoUrl?: string; // Optional video

  // Location & Shipping
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  shippingAvailable: boolean;
  shippingCost?: number;
  pickupOnly: boolean;

  // Seller Information
  sellerId: mongoose.Types.ObjectId;

  // Status & Visibility
  status: ProductStatus;
  isActive: boolean;
  isFeatured: boolean;
  isNegotiable: boolean;

  // Analytics
  views: number;
  likes: number;
  shares: number;
  favorites: number;

  // Marketplace Features
  tags: string[];
  attributes: Record<string, any>; // Flexible key-value pairs

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  soldAt?: Date;

  // Relationships (populated)
  seller?: any;
}

const ProductSchema = new mongoose.Schema<IProduct>(
  {
    // Basic Information
    title: {
      type: String,
      required: [true, "Please provide a title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
      index: true,
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
      trim: true,
      maxlength: [2000, "Description cannot be more than 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Please provide a price"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      min: [0, "Original price cannot be negative"],
    },

    // Categorization
    category: {
      type: String,
      required: [true, "Please provide a category"],
      trim: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },

    // Product Details
    condition: {
      type: String,
      enum: ["new", "like_new", "good", "fair", "poor"],
      required: [true, "Please provide condition"],
    },
    brand: {
      type: String,
      trim: true,
      index: true,
    },
    modelNumber: {
      // ✅ RENAMED FROM 'model'
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: function (v: string[]) {
          return v.length <= 5;
        },
        message: "Cannot have more than 5 images",
      },
    },
    videoUrl: {
      type: String,
      trim: true,
    },

    // Location & Shipping
    location: {
      address: {
        type: String,
        trim: true,
      },
      city: {
        type: String,
        required: [true, "Please provide city"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "Please provide state"],
        trim: true,
      },
      zipCode: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        default: "USA",
        trim: true,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    shippingAvailable: {
      type: Boolean,
      default: false,
    },
    shippingCost: {
      type: Number,
      min: [0, "Shipping cost cannot be negative"],
    },
    pickupOnly: {
      type: Boolean,
      default: false,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "sold", "inactive", "pending", "suspended"],
      default: "active",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isNegotiable: {
      type: Boolean,
      default: false,
    },

    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    favorites: {
      type: Number,
      default: 0,
    },

    // Marketplace Features
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Timestamps
    publishedAt: {
      type: Date,
    },
    soldAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
ProductSchema.index({ sellerId: 1 });

// Keep other indexes
ProductSchema.index({ "location.city": 1, "location.state": 1 });
ProductSchema.index({ price: 1, status: 1 });
ProductSchema.index({ createdAt: -1, status: 1 });
ProductSchema.index({ title: "text", description: "text" });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ isFeatured: 1, createdAt: -1 });

ProductSchema.virtual("discountPercentage").get(function () {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  }
  return 0;
});

// ✅ REMOVE PROBLEMATIC PRE-SAVE  FOR NOW
// We'll handle status changes in the application logic instead

// Instance methods
ProductSchema.methods.incrementViews = function () {
  this.views += 1;
  return this.save();
};

ProductSchema.methods.markAsSold = function () {
  this.status = "sold";
  this.soldAt = new Date();
  return this.save();
};

// Static methods
ProductSchema.statics.findByCategory = function (category: string) {
  return this.find({ category, status: "active", isActive: true });
};

ProductSchema.statics.findByLocation = function (city: string, state: string) {
  return this.find({
    "location.city": new RegExp(city, "i"),
    "location.state": new RegExp(state, "i"),
    status: "active",
    isActive: true,
  });
};

ProductSchema.statics.findFeatured = function () {
  return this.find({ isFeatured: true, status: "active", isActive: true }).sort(
    { createdAt: -1 }
  );
};

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;
