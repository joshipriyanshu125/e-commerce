import path from "path";
import fs from "fs";
import Invoice from "../models/invoiceModel.js";
import Order from "../models/Order.js";
import generateInvoice from "../utils/generateInvoice.js";
import asyncHandler from "../middleware/asyncHandler.js";

// Ensure invoices directory exists helper
const getInvoicePath = (invoiceNumber) => {
    const invoicesDir = path.join(process.cwd(), "src", "invoices");
    if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
    }
    return path.join(invoicesDir, `${invoiceNumber}.pdf`);
};

/*
========================================
CREATE OR GET INVOICE (Automatic / Explicit)
========================================
*/
const INVOICE_ALLOWED_STATUSES = ["Shipped", "Out for Delivery", "Delivered", "Refunded"];

export const createInvoice = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const order = await Order.findById(orderId).populate("user", "name email");

    if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Authorize: User must own the order, or be an admin
    if (req.user._id.toString() !== order.user._id.toString() && !req.user.isAdmin && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Unauthorized to access this order invoice" });
    }

    // Block invoice access for non-shipped/cancelled orders (unless admin)
    if (req.user.role !== "admin" && !req.user.isAdmin && !INVOICE_ALLOWED_STATUSES.includes(order.orderStatus)) {
        return res.status(403).json({ success: false, message: "Invoice is only available after the order has been shipped." });
    }

    // Block cancelled orders
    if (req.user.role !== "admin" && !req.user.isAdmin && order.orderStatus === "Cancelled") {
        return res.status(403).json({ success: false, message: "Invoice is not available for cancelled orders." });
    }

    // Check if invoice already exists for this order
    let invoice = await Invoice.findOne({ order: orderId }).populate("user", "name email");

    if (!invoice) {
        const invoiceNumber = `INV-${Date.now()}`;
        invoice = await Invoice.create({
            user: order.user._id,
            order: order._id,
            invoiceNumber,
            totalAmount: order.totalPrice
        });
        // Populate newly created invoice
        invoice = await Invoice.findById(invoice._id).populate("user", "name email").populate("order");
    } else {
        // If it exists, populate order field fully
        invoice = await Invoice.findById(invoice._id).populate("user", "name email").populate("order");
    }

    // Generate/regenerate PDF
    const invoicePath = getInvoicePath(invoice.invoiceNumber);
    await generateInvoice(invoice, invoicePath);

    res.status(201).json({
        success: true,
        message: "Invoice processed successfully",
        invoice,
        filePath: invoicePath
    });
});

/*
========================================
DOWNLOAD INVOICE PDF
========================================
*/
export const downloadInvoice = asyncHandler(async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ success: false, message: "Missing invoice ID" });
    }

    const invoice = await Invoice.findById(id)
        .populate("user", "name email")
        .populate("order");

    if (!invoice) {
        return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    // Authorization: owner or admin
    if (req.user._id.toString() !== invoice.user._id.toString() && !req.user.isAdmin && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Unauthorized to download this invoice" });
    }

    // Block for ineligible statuses (non-admin)
    const orderStatus = invoice.order?.orderStatus;
    if (req.user.role !== "admin" && !req.user.isAdmin && !INVOICE_ALLOWED_STATUSES.includes(orderStatus)) {
        return res.status(403).json({ success: false, message: "Invoice download is only available after the order has been shipped." });
    }

    const invoicePath = getInvoicePath(invoice.invoiceNumber);

    // Always regenerate to ensure the file is fresh / exists
    try {
        await generateInvoice(invoice, invoicePath);
    } catch (genErr) {
        console.error("PDF generation failed:", genErr.message);
        return res.status(500).json({ success: false, message: "Failed to generate invoice PDF" });
    }

    if (!fs.existsSync(invoicePath)) {
        return res.status(500).json({ success: false, message: "Invoice PDF could not be created" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.sendFile(invoicePath, (err) => {
        if (err) {
            console.error("sendFile error:", err.message);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: "Error sending invoice file" });
            }
        }
    });
});

/*
========================================
VIEW INVOICE ONLINE BY ORDER ID
========================================
*/
export const getInvoiceByOrderId = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const invoice = await Invoice.findOne({ order: orderId })
        .populate("user", "name email")
        .populate("order");

    if (!invoice) {
        return res.status(404).json({ success: false, message: "Invoice not found for this order" });
    }

    // Authorization: owner or admin
    if (req.user._id.toString() !== invoice.user._id.toString() && !req.user.isAdmin && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Unauthorized to view this invoice" });
    }

    // Block for ineligible statuses (non-admin)
    const orderStatus = invoice.order?.orderStatus;
    if (req.user.role !== "admin" && !req.user.isAdmin && !INVOICE_ALLOWED_STATUSES.includes(orderStatus)) {
        return res.status(403).json({ success: false, message: "Invoice is only accessible after the order has been shipped." });
    }

    res.status(200).json({
        success: true,
        invoice
    });
});

/*
========================================
DOWNLOAD REFUND DOCUMENT (user: refunded orders only)
========================================
*/
export const downloadRefundDoc = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate("user", "name email");

    if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Authorization
    if (req.user._id.toString() !== order.user._id.toString() && !req.user.isAdmin && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Only for refunded orders
    if (order.orderStatus !== "Refunded") {
        return res.status(403).json({ success: false, message: "Refund document is only available for refunded orders." });
    }

    const invoice = await Invoice.findOne({ order: orderId })
        .populate("user", "name email")
        .populate("order");

    if (!invoice) {
        return res.status(404).json({ success: false, message: "Invoice not found for this order" });
    }

    // Generate a refund document (reuse generateInvoice with a refund flag)
    const refundDocNumber = `REFUND-${invoice.invoiceNumber}`;
    const invoicesDir = path.join(process.cwd(), "src", "invoices");
    if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
    const refundPath = path.join(invoicesDir, `${refundDocNumber}.pdf`);

    if (!fs.existsSync(refundPath)) {
        try {
            await generateInvoice(invoice, refundPath, { isRefundDoc: true, refundedAt: order.refundedAt });
        } catch (genErr) {
            console.error("Refund PDF generation failed:", genErr.message);
            return res.status(500).json({ success: false, message: "Failed to generate refund document" });
        }
    }

    if (!fs.existsSync(refundPath)) {
        return res.status(500).json({ success: false, message: "Refund document could not be created" });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${refundDocNumber}.pdf"`);
    res.sendFile(refundPath, (err) => {
        if (err) {
            console.error("sendFile refund error:", err.message);
            if (!res.headersSent) {
                res.status(500).json({ success: false, message: "Error sending refund document" });
            }
        }
    });
});

/*
========================================
REGENERATE INVOICE PDF MANUALLY (ADMIN ONLY)
========================================
*/
export const regenerateInvoice = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
        .populate("user", "name email")
        .populate("order");

    if (!invoice) {
        return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const invoicePath = getInvoicePath(invoice.invoiceNumber);
    
    // Regenerate PDF
    await generateInvoice(invoice, invoicePath);

    res.status(200).json({
        success: true,
        message: "Invoice PDF regenerated successfully",
        invoice
    });
});

/*
========================================
GET INVOICE HISTORY (ADMIN ONLY)
========================================
*/
export const getInvoiceHistory = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const count = await Invoice.countDocuments();
    const invoices = await Invoice.find()
        .populate("user", "name email")
        .populate("order")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        success: true,
        invoices,
        page,
        pages: Math.ceil(count / limit),
        total: count
    });
});