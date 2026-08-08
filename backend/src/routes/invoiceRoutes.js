import express from "express";
import { 
    createInvoice, 
    downloadInvoice, 
    getInvoiceByOrderId, 
    getInvoiceHistory, 
    regenerateInvoice,
    downloadRefundDoc
} from "../controllers/invoiceController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createInvoice);
router.get("/download", protect, downloadInvoice);
router.get("/order/:orderId", protect, getInvoiceByOrderId);
router.get("/refund-doc/:orderId", protect, downloadRefundDoc);
router.get("/history", protect, admin, getInvoiceHistory);
router.post("/:id/regenerate", protect, admin, regenerateInvoice);

export default router;