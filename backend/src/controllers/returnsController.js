import asyncHandler from "../middleware/asyncHandler.js";
import ReturnRequest from "../models/returnModel.js";
import Order from "../models/Order.js";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import { notifyAdmins } from "../services/notificationService.js";

// Create return request (with optional photos uploaded)
const createReturnRequest = asyncHandler(async (req, res) => {
  const { orderId, items, reason, notes } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  // upload photos if present (await results and collect secure URLs)
  const uploadedUrls = [];

  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: `returns/${req.user._id}` }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          });
          streamifier.createReadStream(file.buffer).pipe(stream);
        });
        if (result && result.secure_url) uploadedUrls.push(result.secure_url);
      } catch (err) {
        console.error('Cloudinary upload error', err);
      }
    }
  }

  const returnReq = await ReturnRequest.create({
    user: req.user._id,
    order: order._id,
    items: items || [],
    photos: uploadedUrls,
    status: "Requested",
    notes,
  });

  // Notify admins about the refund request
  notifyAdmins({
    title: "Refund Requested",
    message: `User requested a refund for order #${order._id.toString().slice(-6).toUpperCase()}.`,
    type: "refund_requested",
  }).catch((err) => console.error("Return request notify error:", err));

  res.status(201).json({ success: true, returnReq });
});

const getUserReturns = asyncHandler(async (req, res) => {
  const returns = await ReturnRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, returns });
});

export { createReturnRequest, getUserReturns };
