import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order"
        },

        invoiceNumber: String,

        totalAmount: Number
    },
    { timestamps: true }
);

const Invoice = mongoose.model(
    "Invoice",
    invoiceSchema
);

export default Invoice;