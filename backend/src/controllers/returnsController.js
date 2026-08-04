import asyncHandler from "../middleware/asyncHandler.js";
import ReturnRequest from "../models/returnModel.js";
import Order from "../models/Order.js";
import streamifier from "streamifier";
import cloudinary from "../config/cloudinary.js";
import { notifyAdmins, sendNotification } from "../services/notificationService.js";

/*
==============================
CREATE RETURN REQUEST (USER)
==============================
*/
const createReturnRequest = asyncHandler(async (req, res) => {
    const { orderId, items, reason, additionalComments } = req.body;

    if (!reason) {
        return res.status(400).json({ success: false, message: "Return reason is required" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Ownership check
    if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Only allow returns for Delivered orders
    if (order.orderStatus !== "Delivered") {
        return res.status(400).json({
            success: false,
            message: "Returns can only be requested for delivered orders",
        });
    }

    // Prevent duplicate return requests
    const existingReturn = await ReturnRequest.findOne({ order: orderId, user: req.user._id });
    if (existingReturn) {
        return res.status(400).json({
            success: false,
            message: "A return request already exists for this order",
        });
    }

    // Upload photos if present
    const uploadedUrls = [];

    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
            try {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: `returns/${req.user._id}` },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result);
                        }
                    );
                    streamifier.createReadStream(file.buffer).pipe(stream);
                });
                if (result && result.secure_url) uploadedUrls.push(result.secure_url);
            } catch (err) {
                console.error("Cloudinary upload error", err);
            }
        }
    }

    // Parse items if sent as JSON string
    let parsedItems = [];
    try {
        parsedItems = typeof items === "string" ? JSON.parse(items) : (items || []);
    } catch {
        parsedItems = [];
    }

    const returnReq = await ReturnRequest.create({
        user: req.user._id,
        order: order._id,
        reason,
        additionalComments: additionalComments || "",
        items: parsedItems,
        photos: uploadedUrls,
        status: "Requested",
    });

    // Update order's returnInfo
    order.returnInfo = {
        requestId: returnReq._id,
        status: "Requested",
        reason,
        requestedAt: new Date(),
    };
    await order.save();

    // Notify admins
    notifyAdmins({
        title: "Return Requested",
        message: `User requested a return for order #${order._id.toString().slice(-6).toUpperCase()}. Reason: ${reason}`,
        type: "refund_requested",
    }).catch((err) => console.error("Return request notify error:", err));

    res.status(201).json({ success: true, returnReq });
});

/*
==============================
GET USER RETURNS
==============================
*/
const getUserReturns = asyncHandler(async (req, res) => {
    const returns = await ReturnRequest.find({ user: req.user._id })
        .populate("order", "orderItems totalPrice orderStatus createdAt")
        .sort({ createdAt: -1 });
    res.status(200).json({ success: true, returns });
});

/*
==============================
GET ALL RETURNS (ADMIN)
==============================
*/
const getAdminReturns = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    if (status && status !== "All") query.status = status;

    const returns = await ReturnRequest.find(query)
        .populate("user", "name email")
        .populate("order", "orderItems totalPrice orderStatus createdAt")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

    const total = await ReturnRequest.countDocuments(query);

    res.status(200).json({
        success: true,
        returns,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
    });
});

/*
==============================
APPROVE RETURN (ADMIN)
==============================
*/
const approveReturnRequest = asyncHandler(async (req, res) => {
    const returnReq = await ReturnRequest.findById(req.params.id).populate("order");

    if (!returnReq) {
        return res.status(404).json({ success: false, message: "Return request not found" });
    }

    returnReq.status = "Approved";
    returnReq.resolvedAt = new Date();
    returnReq.resolvedBy = req.user._id;
    await returnReq.save();

    // Update order returnInfo
    if (returnReq.order) {
        returnReq.order.returnInfo = {
            ...returnReq.order.returnInfo,
            status: "Approved",
            resolvedAt: new Date(),
        };
        await returnReq.order.save();
    }

    // Notify customer
    try {
        await sendNotification({
            userId: returnReq.user,
            title: "Return Approved",
            message: "Your return request has been approved. Refund will be processed shortly.",
            type: "order_status",
        });
    } catch (err) {
        console.error("Return approval notification failed:", err.message);
    }

    res.status(200).json({ success: true, message: "Return approved", returnReq });
});

/*
==============================
REJECT RETURN (ADMIN)
==============================
*/
const rejectReturnRequest = asyncHandler(async (req, res) => {
    const { adminNotes } = req.body;
    const returnReq = await ReturnRequest.findById(req.params.id).populate("order");

    if (!returnReq) {
        return res.status(404).json({ success: false, message: "Return request not found" });
    }

    returnReq.status = "Rejected";
    returnReq.resolvedAt = new Date();
    returnReq.resolvedBy = req.user._id;
    returnReq.adminNotes = adminNotes || "Return request rejected";
    await returnReq.save();

    // Update order returnInfo
    if (returnReq.order) {
        returnReq.order.returnInfo = {
            ...returnReq.order.returnInfo,
            status: "Rejected",
            resolvedAt: new Date(),
        };
        await returnReq.order.save();
    }

    // Notify customer
    try {
        await sendNotification({
            userId: returnReq.user,
            title: "Return Rejected",
            message: `Your return request has been rejected. Reason: ${adminNotes || "See admin notes"}`,
            type: "order_status",
        });
    } catch (err) {
        console.error("Return rejection notification failed:", err.message);
    }

    res.status(200).json({ success: true, message: "Return rejected", returnReq });
});

export {
    createReturnRequest,
    getUserReturns,
    getAdminReturns,
    approveReturnRequest,
    rejectReturnRequest,
};
