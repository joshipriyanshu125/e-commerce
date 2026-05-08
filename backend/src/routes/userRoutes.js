import express from "express";

import {
    getUserProfile,
    adminRoute
} from "../controllers/userController.js";

import {
    protect,
    admin
} from "../middlewares/authMiddleware.js";

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

export default router;