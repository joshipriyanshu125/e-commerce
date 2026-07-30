import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
        },

        image: {
            url: { type: String, default: "" },
            public_id: { type: String, default: "" },
        },

        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },

        // main = Men/Women tree, featured = cross-gender collections
        navGroup: {
            type: String,
            enum: ["main", "featured"],
            default: "main",
        },

        sortOrder: {
            type: Number,
            default: 0,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        showInMegaMenu: {
            type: Boolean,
            default: true,
        },

        seo: {
            metaTitle: { type: String, default: "" },
            metaDescription: { type: String, default: "" },
            metaKeywords: { type: String, default: "" },
        },
    },
    {
        timestamps: true,
    }
);

categorySchema.index({ parent: 1, sortOrder: 1 });
categorySchema.index({ navGroup: 1, isActive: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
