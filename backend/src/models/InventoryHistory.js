import mongoose from "mongoose";

const inventoryHistorySchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        // size and color of variant (empty for root-level stock changes)
        size: {
            type: String,
            default: "",
        },
        color: {
            type: String,
            default: "",
        },
        quantityChanged: {
            type: Number,
            required: true, // positive for restock/returns, negative for sales
        },
        previousStock: {
            type: Number,
            required: true,
        },
        newStock: {
            type: Number,
            required: true,
        },
        reason: {
            type: String, // e.g. "Order #12345", "Restock", "Adjustment", "Return"
            required: true,
        },
        user: {
            type: String, // "System" or admin name/id
            default: "System",
        },
        // Optional details for restocking
        supplier: {
            type: String,
            default: "",
        },
        cost: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Indexes for history searches
inventoryHistorySchema.index({ product: 1, createdAt: -1 });
inventoryHistorySchema.index({ createdAt: -1 });

const InventoryHistory = mongoose.model(
    "InventoryHistory",
    inventoryHistorySchema
);

export default InventoryHistory;
