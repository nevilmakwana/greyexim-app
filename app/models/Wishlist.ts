import mongoose from "mongoose";

const WishlistSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userEmail: { type: String, required: true },
  userPhone: { type: String },
  marketingOptIn: { type: Boolean, default: false },
  leadStatus: { type: String, default: "New" },
  leadNotes: { type: String, default: "" },
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  addedAt: { type: Date, default: Date.now }
});

// Taaki user ek product ko do baar wishlist na kar sake
WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.models.Wishlist || mongoose.model("Wishlist", WishlistSchema);
