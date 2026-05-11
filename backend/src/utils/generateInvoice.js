import PDFDocument from "pdfkit";
import fs from "fs";

const generateInvoice = (invoiceData, filePath) => {

    const doc = new PDFDocument();

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(26).text("Invoice", {
        align: "center"
    });

    doc.moveDown();

    doc.fontSize(16).text(
        `Invoice Number: ${invoiceData.invoiceNumber}`
    );

    doc.moveDown();

    doc.text(
        `Total Amount: ₹${invoiceData.totalAmount}`
    );

    doc.end();

    stream.on("finish", () => {
        console.log("PDF generated successfully");
    });
};

export default generateInvoice;