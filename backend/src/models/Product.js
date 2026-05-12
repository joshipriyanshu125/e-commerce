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
    },
    {
        timestamps: true,
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

        images: [
            {
                public_id: {
                    type: String,
                    required: true,
                },

                url: {
                    type: String,
                    required: true,
                },
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
    {
        timestamps: true,
    }
);

const Product = mongoose.model("Product", productSchema);

export default Product;