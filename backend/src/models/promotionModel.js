import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["percentage", "flat", "bogo", "free_shipping", "flash_sale"], required: true },
    value: { type: Number, default: 0, min: 0 },
    banner: { title: String, subtitle: String, image: String, link: String },
    categories: { type: [String], default: [] },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    minCartValue: { type: Number, default: 0 },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
}, { timestamps: true });

promotionSchema.index({ isActive: 1, startsAt: 1, endsAt: 1, priority: -1 });
export default mongoose.model("Promotion", promotionSchema);
