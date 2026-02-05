import mongoose, { Schema, model, models } from "mongoose";

const AddressSchema = new Schema(
  {
    label: { type: String, default: "Home" }, // Home / Office / etc
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    pincode: { type: String, default: "" },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    // Password is optional for OAuth users (Google/Facebook)
    password: { type: String, select: false },

    // "google", "facebook", or "credentials"
    provider: { type: String, default: "credentials" },

    // Profile
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    pincode: { type: String, default: "" },
    country: { type: String, default: "India" },
    marketingOptIn: { type: Boolean, default: false },

    // Address book (Amazon-style). Keep legacy single-address fields above for backward compat.
    addresses: { type: [AddressSchema], default: [] },

    // Orders
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { timestamps: true }
);

const User = models.User || model("User", UserSchema);
export default User;

