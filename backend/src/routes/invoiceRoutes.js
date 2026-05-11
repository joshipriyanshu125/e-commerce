import express from "express";

import { createInvoice } from "../controllers/invoiceController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createInvoice);

export default router;