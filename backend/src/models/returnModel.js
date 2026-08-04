import mongoose from "mongoose";

const returnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    additionalComments: {
      type: String,
      default: "",
    },

    items: [
      {
        product: { type: mongoose.Schema.Types.Mixed },
        name: String,
        quantity: { type: Number, required: true },
        reason: { type: String },
      },
    ],

    photos: [String],

    status: {
      type: String,
      enum: ["Requested", "Approved", "Rejected", "Refunded"],
      default: "Requested",
    },

    notes: { type: String },

    adminNotes: { type: String },

    resolvedAt: { type: Date },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

returnSchema.index({ user: 1, createdAt: -1 });
returnSchema.index({ status: 1 });

const ReturnRequest = mongoose.model("ReturnRequest", returnSchema);

export default ReturnRequest;
