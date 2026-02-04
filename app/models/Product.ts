import { Schema, model, models } from "mongoose";

const ProductSchema = new Schema(
  {
    designName: { type: String, required: true },
    designCode: { type: String, required: true },
    description: String,
    category: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },

    // 🔥 FIX HERE
    images: {
      type: [String],
      default: [], // 👈 IMPORTANT
    },
  },
  { timestamps: true }
);

const Product = models.Product || model("Product", ProductSchema);
export default Product;
