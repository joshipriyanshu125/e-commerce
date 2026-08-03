import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
        },

        message: {
            type: String,
            required: true,
        },

        type: {
            type: String,
            enum: [
                "new_order",
                "new_user",
                "out_of_stock",
                "low_inventory",
                "coupon_expired",
                "payment_failed",
                "refund_requested",
                "order_status",
                "general",
            ],
            default: "general",
        },

        read: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model(
    "Notification",
    notificationSchema
);

export default Notification;