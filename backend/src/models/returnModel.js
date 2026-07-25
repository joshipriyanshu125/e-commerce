import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        reason: { type: String },
      },
    ],
    photos: [String],
    status: { type: String, default: "Requested" },
    notes: { type: String },
    adminNotes: { type: String },
  },
  { timestamps: true }
);

const ReturnRequest = mongoose.model("ReturnRequest", returnSchema);

export default ReturnRequest;
