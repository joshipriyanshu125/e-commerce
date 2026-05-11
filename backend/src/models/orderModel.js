import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true
                },

                quantity: {
                    type: Number,
                    required: true
                }
            }
        ],

        shippingAddress: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address",
            required: true
        },

        totalAmount: {
            type: Number,
            required: true
        },

        paymentMethod: {
            type: String,
            default: "Cash On Delivery"
        },

        isPaid: {
            type: Boolean,
            default: false
        },

        orderStatus: {
            type: String,
            default: "Processing"
        }
    },
    { timestamps: true }
);

const Order = mongoose.model(
    "Order",
    orderSchema
);

export default Order;