import mongoose from "mongoose";

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        name: String,
        image: String,
        price: Number,
        quantity: Number,
        size: String,
        color: String,
    },
    { _id: false }
);

const shippingSchema = new mongoose.Schema(
    {
        fullName: String,
        phone: String,
        address: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
    },
    { _id: false }
);

const paymentSchema = new mongoose.Schema(
    {
        method: {
            type: String,
            default: "COD"
        },
        paymentStatus: {
            type: String,
            enum: ["Pending", "Paid", "Failed", "Refunded"],
            default: "Pending"
        },
        transactionId: String,
        razorpayOrderId: { type: String, index: true },
        razorpayPaymentId: String,
        razorpaySignature: String,
        paidAt: Date,
    },
    { _id: false }
);

const trackingHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        note: {
            type: String,
            default: "",
        },
        updatedBy: {
            type: String,       // "admin" | "system" | "user"
            default: "system",
        },
    },
    { _id: false }
);

const cancellationSchema = new mongoose.Schema(
    {
        reason: {
            type: String,
            default: "",
        },
        cancelledBy: {
            type: String,   // "user" | "admin"
            default: "user",
        },
        cancelledAt: {
            type: Date,
        },
        notes: String,
    },
    { _id: false }
);

const returnInfoSchema = new mongoose.Schema(
    {
        requestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ReturnRequest",
        },
        status: {
            type: String,
            enum: ["Requested", "Approved", "Rejected", "Refunded"],
        },
        reason: String,
        requestedAt: Date,
        resolvedAt: Date,
    },
    { _id: false }
);

// ─── Main Order Schema ─────────────────────────────────────────────────────────

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        orderItems: [orderItemSchema],

        shippingInfo: shippingSchema,

        paymentInfo: paymentSchema,

        itemsPrice: {
            type: Number,
            required: true
        },

        shippingPrice: {
            type: Number,
            default: 0
        },

        taxPrice: {
            type: Number,
            default: 0
        },

        totalPrice: {
            type: Number,
            required: true
        },

        // ── Order Status — full fulfillment pipeline ──────────────────────────
        orderStatus: {
            type: String,
            enum: [
                "Pending",
                "Confirmed",
                "Packed",
                "Shipped",
                "Out for Delivery",
                "Delivered",
                "Cancelled",
                "Refunded"
            ],
            default: "Pending"
        },

        // ── Tracking History ──────────────────────────────────────────────────
        trackingHistory: [trackingHistorySchema],

        // ── Courier / Shipping details (assigned by admin after Shipped) ──────
        courierName: {
            type: String,
            default: ""
        },

        trackingNumber: {
            type: String,
            default: ""
        },

        estimatedDelivery: {
            type: Date,
            default: null,
        },

        // ── Cancellation info ─────────────────────────────────────────────────
        cancellation: cancellationSchema,

        // ── Return / Refund info ──────────────────────────────────────────────
        returnInfo: returnInfoSchema,

        // ── Timestamps ───────────────────────────────────────────────────────
        isPaid: {
            type: Boolean,
            default: false,
        },

        refundedAt: Date,

        cancelledAt: Date,

        deliveredAt: Date,
    },
    {
        timestamps: true
    }
);

// ─── Indexes for performance ───────────────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
