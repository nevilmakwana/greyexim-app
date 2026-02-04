import mongoose from "mongoose";

const NavigationSchema = new mongoose.Schema({
  label: { type: String, required: true },
  icon: { type: String, required: true }, // icons like 'home', 'search', 'heart', 'user', 'bag'
  path: { type: String, required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Navigation || mongoose.model("Navigation", NavigationSchema);