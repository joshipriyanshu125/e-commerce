import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        name: String,

        image: String,

        price: Number,

        quantity: Number
    },
    { _id: false }
);

const shippingSchema = new mongoose.Schema(
    {
        fullName: String,

        phone: String,

        address: String,

        city: String,

        postalCode: String,

        country: String
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
            enum: ["Pending", "Paid", "Failed"],
            default: "Pending"
        },

        transactionId: String
    },
    { _id: false }
);

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

        orderStatus: {
            type: String,
            enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
            default: "Processing"
        },

        deliveredAt: Date
    },
    {
        timestamps: true
    }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;