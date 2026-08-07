import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    quantity: {
        type: Number,
        default: 1
    }
});

const cartSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        items: [cartItemSchema],

        totalPrice: {
            type: Number,
            default: 0
        },

        // Cart recovery tracking — updated whenever cart is modified
        lastActivityAt: {
            type: Date,
            default: Date.now,
        },

        // Tracks which recovery reminder tiers have been sent
        reminderSentAt: {
            twoHours: { type: Date, default: null },
            twentyFourHours: { type: Date, default: null },
            threeDays: { type: Date, default: null },
        },
    },
    { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;