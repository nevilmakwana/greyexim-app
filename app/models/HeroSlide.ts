import { Schema, model, models } from "mongoose";

const HeroSlideSchema = new Schema(
  {
    image: { type: String, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    ctaText: { type: String, default: "Shop Collection" },
    ctaLink: { type: String, default: "/shop" },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const HeroSlide = models.HeroSlide || model("HeroSlide", HeroSlideSchema);
export default HeroSlide;
