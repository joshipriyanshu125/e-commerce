import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { createReturnRequest, getUserReturns } from "../controllers/returnsController.js";

const router = express.Router();

// create return (accept images)
router.post("/", protect, upload.array("photos", 5), createReturnRequest);

// get user's returns
router.get("/", protect, getUserReturns);

export default router;
