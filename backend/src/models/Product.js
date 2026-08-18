import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        reason: { type: String, required: true },
    },
    { timestamps: true, _id: false }
);

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
        name: {
            type: String,
            required: true,
        },
        // NEW: review title
        title: {
            type: String,
            default: "",
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
        },
        // NEW: review images uploaded to Cloudinary
        images: [
            {
                public_id: { type: String, required: true },
                url: { type: String, required: true },
            },
        ],
        // NEW: verified purchase badge (set by system only)
        isVerifiedPurchase: {
            type: Boolean,
            default: false,
        },
        // NEW: user IDs who marked this helpful (deduplication by userId)
        helpfulVotes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        // NEW: reports submitted against this review
        reports: [reportSchema],
        // NEW: edit history for audit trail
        editHistory: [
            {
                rating: Number,
                title: String,
                comment: String,
                editedAt: { type: Date, default: Date.now },
            },
        ],
        status: {
            type: String,
            enum: ["Pending", "Approved", "Hidden"],
            default: "Pending",
        },
        reply: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

const variantSchema = new mongoose.Schema(
    {
        size: { type: String, default: "" },
        color: { type: String, default: "" },
        countInStock: { type: Number, required: true, default: 0, min: 0 },
        lowStockThreshold: { type: Number, default: 5 },
        sku: { type: String, default: "" },
    }
);

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
        },
        // Discount price (sale price shown to customer)
        discountPrice: {
            type: Number,
            default: null,
        },
        countInStock: {
            type: Number,
            required: true,
            default: 0,
        },
        // NEW: variant-level independent stock
        variants: {
            type: [variantSchema],
            default: [],
        },
        // NEW: root-level threshold for products without variants
        lowStockThreshold: {
            type: Number,
            default: 5,
        },
        category: {
            type: String,
            default: "",
        },
        brand: {
            type: String,
            default: "",
        },
        gender: {
            type: String,
            enum: ["men", "women", "unisex", "kids"],
            default: "unisex",
        },
        soldCount: { type: Number, default: 0, min: 0 },
        // Tags e.g. ["running", "sports"]
        tags: {
            type: [String],
            default: [],
        },
        // Size variants e.g. ["7", "8", "9", "10"] or ["S", "M", "L"]
        sizes: {
            type: [String],
            default: [],
        },
        // Color variants e.g. ["Black", "White"]
        colors: {
            type: [String],
            default: [],
        },
        // Product visibility status
        status: {
            type: String,
            enum: ["Active", "Draft", "OutOfStock"],
            default: "Active",
        },
        images: [
            {
                public_id: { type: String, required: true },
                url: { type: String, required: true },
                color: { type: String, default: "" },
            },
        ],
        reviews: [reviewSchema],
        rating: {
            type: Number,
            required: true,
            default: 0,
        },
        numReviews: {
            type: Number,
            required: true,
            default: 0,
        },
        // Feature highlights (shown as cards on the product page)
        features: [
            {
                title: { type: String, default: "" },
                description: { type: String, default: "" },
                imageUrl: { type: String, default: "" },
            },
        ],
        // Key-value specification pairs (Brand, Fit, Fabric, Rise, etc.)
        specifications: [
            {
                key: { type: String, default: "" },
                value: { type: String, default: "" },
            },
        ],
        // Manufacturer / store info shown on the product page
        manufacturerInfo: {
            name: { type: String, default: "" },
            address: { type: String, default: "" },
            location: { type: String, default: "" },
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true }
);

// Supports the catalogue's common filter and sort paths. Text search remains a
// safe fallback for installations without an Atlas Search index.
productSchema.index({ name: "text", description: "text", category: "text", brand: "text", tags: "text" });
productSchema.index({ status: 1, category: 1, brand: 1, price: 1 });
productSchema.index({ status: 1, createdAt: -1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
