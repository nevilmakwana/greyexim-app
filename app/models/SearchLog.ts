import mongoose from "mongoose";

const SearchLogSchema = new mongoose.Schema(
  {
    term: { type: String, required: true, trim: true },
    normalizedTerm: { type: String, required: true, trim: true, lowercase: true },
    userEmail: { type: String, default: "" },
    source: { type: String, default: "unknown" },
  },
  { timestamps: true }
);

SearchLogSchema.index({ normalizedTerm: 1, createdAt: -1 });
SearchLogSchema.index({ userEmail: 1, createdAt: -1 });
SearchLogSchema.index({ createdAt: -1 });

export default mongoose.models.SearchLog ||
  mongoose.model("SearchLog", SearchLogSchema);

