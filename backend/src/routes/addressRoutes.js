import express from "express";

import { saveAddress } from "../controllers/addressController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, saveAddress);

export default router;