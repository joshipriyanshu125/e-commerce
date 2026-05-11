import express from "express";
import { getInvoice } from "../controllers/invoiceController.js";

const router = express.Router();

// GET INVOICE BY ORDER ID
router.get("/:id", getInvoice);

export default router;
