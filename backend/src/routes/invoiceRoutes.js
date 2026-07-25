import express from "express";

import { createInvoice, downloadInvoice } from "../controllers/invoiceController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createInvoice);
router.get('/download', protect, downloadInvoice);

export default router;