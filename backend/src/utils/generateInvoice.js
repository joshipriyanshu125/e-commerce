import PDFDocument from "pdfkit";
import fs from "fs";
import Settings from "../models/settingsModel.js";

// Helper to download remote image buffer safely
const getImageBuffer = async (url) => {
    if (!url) return null;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (err) {
        console.error(`Error downloading image (${url}):`, err.message);
        return null;
    }
};

const generateInvoice = async (invoice, filePath, options = {}) => {
    const { isRefundDoc = false, refundedAt = null } = options;

    // 1. Fetch store settings for company details
    let settings = await Settings.findOne();
    if (!settings) {
        settings = {
            storeInfo: {
                name: "Atelier Premium Store",
                logo: "",
                address: "123 Fashion Ave, Suite 500, New York, NY 10001",
                phone: "+1 (555) 234-5678",
                email: "support@atelier.com"
            },
            tax: {
                taxType: "GST",
                taxRate: 18,
                taxId: "29ABCDE1234F1Z5"
            }
        };
    }

    const order = invoice.order || {};
    const user = invoice.user || {};
    const items = order.orderItems || [];

    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({ size: "A4", margin: 40 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header section (Store Details on Left, Invoice/Refund Details on Right)
        doc.font("Helvetica-Bold").fontSize(18).fillColor("#1c1c1c").text(settings.storeInfo.name, 40, 40);
        doc.font("Helvetica").fontSize(9).fillColor("#555555")
           .text(settings.storeInfo.address, 40, 60, { width: 230 })
           .text(`Phone: ${settings.storeInfo.phone}`, 40, 85)
           .text(`Email: ${settings.storeInfo.email}`, 40, 97);

        if (settings.tax && settings.tax.taxId) {
            doc.text(`${settings.tax.taxType}IN: ${settings.tax.taxId}`, 40, 109);
        }

        // Title: INVOICE or REFUND DOCUMENT
        const docTitle = isRefundDoc ? "REFUND DOCUMENT" : "INVOICE";
        const titleColor = isRefundDoc ? "#7c3aed" : "#1c1c1c";
        doc.font("Helvetica-Bold").fontSize(isRefundDoc ? 16 : 20).fillColor(titleColor).text(docTitle, 380, 40, { align: "right" });

        if (isRefundDoc) {
            // Show refund stamp
            doc.font("Helvetica-Bold").fontSize(9).fillColor("#7c3aed").text("REFUNDED", 380, 65, { align: "right" });
        }

        doc.font("Helvetica-Bold").fontSize(9).fillColor("#1c1c1c").text(isRefundDoc ? "Refund Details" : "Invoice Details", 380, isRefundDoc ? 80 : 65, { align: "right" });
        doc.font("Helvetica").fontSize(9).fillColor("#555555")
           .text(`Invoice No: ${invoice.invoiceNumber}`, 380, isRefundDoc ? 95 : 80, { align: "right" })
           .text(`Order ID: #${order._id.toString().slice(-8).toUpperCase()}`, 380, isRefundDoc ? 107 : 92, { align: "right" })
           .text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}`, 380, isRefundDoc ? 119 : 104, { align: "right" })
           .text(`Payment Status: ${order.paymentInfo?.paymentStatus || "Pending"}`, 380, isRefundDoc ? 131 : 116, { align: "right" })
           .text(`Payment Method: ${order.paymentInfo?.method || "COD"}`, 380, isRefundDoc ? 143 : 128, { align: "right" });

        if (isRefundDoc && refundedAt) {
            doc.font("Helvetica-Bold").fontSize(9).fillColor("#7c3aed")
               .text(`Refunded On: ${new Date(refundedAt).toLocaleDateString()}`, 380, 155, { align: "right" });
        }


        // Divider
        doc.moveTo(40, 150).lineTo(555, 150).strokeColor("#e2e8f0").lineWidth(1).stroke();

        // Billing and Shipping Information
        const shipping = order.shippingInfo || {};
        
        doc.font("Helvetica-Bold").fontSize(10).fillColor("#1c1c1c").text("Bill To:", 40, 165);
        doc.font("Helvetica").fontSize(9).fillColor("#555555")
           .text(shipping.fullName || user.name || "Customer", 40, 180)
           .text(shipping.address || "Address N/A", 40, 192, { width: 230 })
           .text(`${shipping.city || ""}, ${shipping.state || ""} ${shipping.postalCode || ""}`, 40, 204)
           .text(`Phone: ${shipping.phone || "N/A"}`, 40, 216)
           .text(`Email: ${user.email || "N/A"}`, 40, 228);

        doc.font("Helvetica-Bold").fontSize(10).fillColor("#1c1c1c").text("Ship To:", 300, 165);
        doc.font("Helvetica").fontSize(9).fillColor("#555555")
           .text(shipping.fullName || "Customer", 300, 180)
           .text(shipping.address || "Address N/A", 300, 192, { width: 230 })
           .text(`${shipping.city || ""}, ${shipping.state || ""} ${shipping.postalCode || ""}`, 300, 204)
           .text(`Phone: ${shipping.phone || "N/A"}`, 300, 216);

        // Divider
        doc.moveTo(40, 250).lineTo(555, 250).strokeColor("#e2e8f0").lineWidth(1).stroke();

        // Product Items Table
        let y = 265;
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#1c1c1c");
        doc.text("Item Details", 40, y);
        doc.text("Qty", 320, y, { width: 30, align: "center" });
        doc.text("Size/Color", 360, y, { width: 70, align: "center" });
        doc.text("Unit Price", 440, y, { width: 50, align: "right" });
        doc.text("Total", 500, y, { width: 55, align: "right" });

        // Underline table header
        y += 15;
        doc.moveTo(40, y).lineTo(555, y).strokeColor("#cbd5e1").lineWidth(1).stroke();
        y += 10;

        for (const item of items) {
            // Check if page overflow
            if (y > 720) {
                doc.addPage();
                y = 40;
                // Redraw table headers on new page
                doc.font("Helvetica-Bold").fontSize(9).fillColor("#1c1c1c");
                doc.text("Item Details", 40, y);
                doc.text("Qty", 320, y, { width: 30, align: "center" });
                doc.text("Size/Color", 360, y, { width: 70, align: "center" });
                doc.text("Unit Price", 440, y, { width: 50, align: "right" });
                doc.text("Total", 500, y, { width: 55, align: "right" });
                y += 15;
                doc.moveTo(40, y).lineTo(555, y).strokeColor("#cbd5e1").lineWidth(1).stroke();
                y += 10;
            }

            // Thumbnail download & draw
            let imageBuffer = null;
            if (item.image) {
                imageBuffer = await getImageBuffer(item.image);
            }

            const itemTextX = imageBuffer ? 85 : 40;
            const itemTextWidth = imageBuffer ? 220 : 265;

            // Draw image/placeholder
            if (imageBuffer) {
                try {
                    doc.image(imageBuffer, 40, y, { width: 35, height: 35 });
                } catch (imgErr) {
                    console.error("Error drawing image in pdfkit:", imgErr.message);
                    // Draw square placeholder
                    doc.strokeColor("#e2e8f0").rect(40, y, 35, 35).stroke();
                }
            } else {
                // Draw elegant grey box border as a placeholder
                doc.strokeColor("#e2e8f0").rect(40, y, 35, 35).stroke();
            }

            // Product name
            doc.font("Helvetica-Bold").fontSize(9).fillColor("#2d3748")
               .text(item.name, itemTextX, y, { width: itemTextWidth });

            // Size/Color options under item
            const sizeStr = item.size ? `Size: ${item.size}` : "";
            const colorStr = item.color ? `Color: ${item.color}` : "";
            const optionsText = [sizeStr, colorStr].filter(Boolean).join(" | ");

            if (optionsText) {
                doc.font("Helvetica").fontSize(8).fillColor("#718096")
                   .text(optionsText, itemTextX, y + 15, { width: itemTextWidth });
            }

            // Quantity
            doc.font("Helvetica").fontSize(9).fillColor("#2d3748")
               .text(item.quantity.toString(), 320, y + 10, { width: 30, align: "center" });

            // Option string or details
            const optStr = [item.size || "-", item.color || "-"].filter(s => s !== "-").join("/");
            doc.text(optStr || "N/A", 360, y + 10, { width: 70, align: "center" });

            // Price & Subtotal
            const unitPrice = item.price || 0;
            const itemTotal = unitPrice * item.quantity;

            doc.text(`$${unitPrice.toFixed(2)}`, 440, y + 10, { width: 50, align: "right" });
            doc.text(`$${itemTotal.toFixed(2)}`, 500, y + 10, { width: 55, align: "right" });

            y += 45; // Space for next row
        }

        // Draw summary totals (Subtotal, Shipping, Tax, Grand Total)
        y += 10;
        doc.moveTo(40, y).lineTo(555, y).strokeColor("#cbd5e1").lineWidth(1).stroke();
        y += 15;

        // Ensure totals fit on page, else create new page
        if (y > 700) {
            doc.addPage();
            y = 40;
        }

        const discount = order.discountAmount || 0;
        const subtotalAmount = order.itemsPrice || 0;
        const taxAmount = order.taxPrice || 0;
        const shippingAmount = order.shippingPrice || 0;
        const grandTotal = order.totalPrice || 0;

        const labelX = 380;
        const valueX = 500;
        const labelWidth = 110;
        const valueWidth = 55;

        doc.font("Helvetica").fontSize(9).fillColor("#4a5568");
        doc.text("Subtotal:", labelX, y, { width: labelWidth, align: "right" });
        doc.text(`$${subtotalAmount.toFixed(2)}`, valueX, y, { width: valueWidth, align: "right" });
        y += 15;

        if (discount > 0) {
            doc.text("Discount:", labelX, y, { width: labelWidth, align: "right" });
            doc.text(`-$${discount.toFixed(2)}`, valueX, y, { width: valueWidth, align: "right" });
            y += 15;
        }

        if (shippingAmount > 0) {
            doc.text("Shipping:", labelX, y, { width: labelWidth, align: "right" });
            doc.text(`$${shippingAmount.toFixed(2)}`, valueX, y, { width: valueWidth, align: "right" });
            y += 15;
        }

        if (taxAmount > 0) {
            doc.text(`${settings.tax.taxType} (${settings.tax.taxRate}%):`, labelX, y, { width: labelWidth, align: "right" });
            doc.text(`$${taxAmount.toFixed(2)}`, valueX, y, { width: valueWidth, align: "right" });
            y += 15;
        }

        doc.font("Helvetica-Bold").fontSize(11).fillColor("#1c1c1c");
        doc.text("Grand Total:", labelX, y, { width: labelWidth, align: "right" });
        doc.text(`$${grandTotal.toFixed(2)}`, valueX, y, { width: valueWidth, align: "right" });
        y += 30;

        // Footer Message
        const footerMsg = isRefundDoc
            ? "This is an official refund document. The refund has been processed for your order. Please retain this for your records."
            : "Thank you for shopping with us! If you have any billing inquiries, please contact our support desk.";
        doc.font("Helvetica-Oblique").fontSize(8).fillColor("#718096")
           .text(footerMsg, 40, y, { align: "center", width: 515 });


        doc.end();

        stream.on("finish", () => {
            console.log("Invoice PDF created successfully at:", filePath);
            resolve();
        });

        stream.on("error", (err) => {
            console.error("PDF stream write error:", err.message);
            reject(err);
        });
    });
}

export default generateInvoice;