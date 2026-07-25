import path from "path";
import fs from "fs";

import Invoice from "../models/invoiceModel.js";
import Order from "../models/Order.js";

import generateInvoice from "../utils/generateInvoice.js";

export const createInvoice = async (req, res) => {
    try {

        const { orderId } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const invoiceNumber = `INV-${Date.now()}`;

        const invoice = await Invoice.create({
            user: order.user,
            order: order._id,
            invoiceNumber,
            totalAmount: order.totalPrice
        });

        // CREATE invoices FOLDER IF NOT EXISTS
        const invoicesDir = path.join(process.cwd(), "src", "invoices");

        if (!fs.existsSync(invoicesDir)) {
            fs.mkdirSync(invoicesDir, { recursive: true });
        }

        // FINAL PDF PATH
        const invoicePath = path.join(
            invoicesDir,
            `${invoiceNumber}.pdf`
        );

        // GENERATE PDF
        generateInvoice(invoice, invoicePath);

        res.status(201).json({
            success: true,
            message: "Invoice generated successfully",
            invoice,
            filePath: invoicePath
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const downloadInvoice = async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) return res.status(400).json({ success: false, message: 'Missing invoice id' });

        const invoice = await Invoice.findById(id).populate('user');
        if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

        // Authorization: owner or admin
        if (req.user._id.toString() !== invoice.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const invoicesDir = path.join(process.cwd(), "src", "invoices");
        const invoicePath = path.join(invoicesDir, `${invoice.invoiceNumber}.pdf`);

        if (!fs.existsSync(invoicePath)) return res.status(404).json({ success: false, message: 'File not found' });

        res.download(invoicePath, `${invoice.invoiceNumber}.pdf`);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}