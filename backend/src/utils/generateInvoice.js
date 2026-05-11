import PDFDocument from "pdfkit";
import fs from "fs";

const generateInvoice = (
    invoiceData,
    path
) => {

    const doc = new PDFDocument();

    doc.pipe(fs.createWriteStream(path));

    doc.fontSize(25).text("Invoice");

    doc.moveDown();

    doc.fontSize(15).text(
        `Invoice Number: ${invoiceData.invoiceNumber}`
    );

    doc.text(
        `Total Amount: ₹${invoiceData.totalAmount}`
    );

    doc.end();
};

export default generateInvoice;