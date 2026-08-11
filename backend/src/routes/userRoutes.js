import express from "express";

import {
    getUserProfile,
    updateUserProfile,
    adminRoute,
    getAllUsers,
    deleteUser,
    blockUser,
    unblockUser,
    getUserOrders,
    getUserAddresses,
    adminResetPassword,
    saveStyleProfile,
} from "../controllers/userController.js";

import {
    protect,
    admin
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/profile",
    protect,
    getUserProfile
);

router.put(
    "/profile",
    protect,
    updateUserProfile
);

router.get(
    "/admin",
    protect,
    admin,
    adminRoute
);

// Admin user management routes
router.get(
    "/",
    protect,
    admin,
    getAllUsers
);

router.delete(
    "/:id",
    protect,
    admin,
    deleteUser
);

// Block / Unblock
router.put("/:id/block", protect, admin, blockUser);
router.put("/:id/unblock", protect, admin, unblockUser);

// Get user orders (admin)
router.get("/:id/orders", protect, admin, getUserOrders);

// Get user addresses (admin)
router.get("/:id/addresses", protect, admin, getUserAddresses);

// Reset password (admin)
router.put("/:id/reset-password", protect, admin, adminResetPassword);

// Save AI Style Profile
router.put("/style-profile", protect, saveStyleProfile);

export default router;