import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    
    // ⚠️ CHANGED: Password is now OPTIONAL (not required for Google/FB users)
    password: { type: String, select: false }, 
    
    // NEW: To know if they logged in via Google, Facebook, or Email
    provider: { type: String, default: "credentials" }, // "google", "facebook", or "credentials"
    
    // Profile Information
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    pincode: { type: String, default: "" },

    // Order History
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }]
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);

export default User;