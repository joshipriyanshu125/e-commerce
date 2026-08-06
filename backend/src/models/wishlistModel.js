import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    priceAtAdd: { type: Number, required: true },
    notifyOnRestock: { type: Boolean, default: true },
}, { timestamps: true });

const wishlistSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [itemSchema], default: [] },
}, { timestamps: true });

wishlistSchema.index({ user: 1, "items.product": 1 });
export default mongoose.model("Wishlist", wishlistSchema);
