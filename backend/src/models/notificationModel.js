import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: [
                // Admin notifications
                "new_order",
                "new_user",
                "payment_failed",
                "return_requested",
                "refund_requested",
                "low_inventory",
                "out_of_stock",
                "coupon_expired",
                "negative_review",
                // User notifications
                "order_status",
                "order_placed",
                "shipping_update",
                "return_update",
                "refund_update",
                "wishlist_alert",
                "price_drop",
                "back_in_stock",
                "promotion",
                "security_alert",
                "general",
            ],
            default: "general",
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        read: {
            type: Boolean,
            default: false,
            index: true,
        },

        // Link to related entity (order, product, return, etc.)
        reference: {
            model: {
                type: String,
                enum: ["Order", "Product", "ReturnRequest", "Coupon", "Review"],
            },
            id: {
                type: mongoose.Schema.Types.ObjectId,
            },
        },

        // Metadata for additional context
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        // For push notifications
        sentViaPush: {
            type: Boolean,
            default: false,
        },

        // For email notifications
        sentViaEmail: {
            type: Boolean,
            default: false,
        },

        readAt: {
            type: Date,
            default: null,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for performance
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ user: 1, type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ deletedAt: 1 }, { sparse: true });

// Soft delete
notificationSchema.methods.softDelete = function () {
    this.deletedAt = new Date();
    return this.save();
};

// Mark as read
notificationSchema.methods.markAsRead = function () {
    this.read = true;
    this.readAt = new Date();
    return this.save();
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
