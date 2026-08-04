import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
    createReturnRequest,
    getUserReturns,
    getAdminReturns,
    approveReturnRequest,
    rejectReturnRequest,
} from "../controllers/returnsController.js";

const router = express.Router();

/*
=====================================
USER ROUTES
=====================================
*/

// Create return request (with optional photo uploads, up to 5)
router.post("/", protect, upload.array("photos", 5), createReturnRequest);

// Get user's own returns
router.get("/", protect, getUserReturns);

/*
=====================================
ADMIN ROUTES
=====================================
*/

// Get all return requests (paginated, with status filter)
router.get("/admin/all", protect, admin, getAdminReturns);

// Approve a return request
router.put("/:id/approve", protect, admin, approveReturnRequest);

// Reject a return request
router.put("/:id/reject", protect, admin, rejectReturnRequest);

export default router;
