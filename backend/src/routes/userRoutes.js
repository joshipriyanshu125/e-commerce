import express from "express";

import {
    getUserProfile,
    adminRoute,
    getAllUsers,
    deleteUser
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


export default router;