import mongoose from "mongoose";

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
        category: {
            type: String,
            default: "",
        },
        brand: {
            type: String,
            default: "",
        },
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
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;