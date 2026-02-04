import mongoose, { Schema, model, models } from "mongoose";

const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String, 
      required: true,
      unique: true,
    },
    image: {
      type: String, 
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true, 
    },
  },
  { timestamps: true }
);

const Category = models.Category || model("Category", CategorySchema);

export default Category;