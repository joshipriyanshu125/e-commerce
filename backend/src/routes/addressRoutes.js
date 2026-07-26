import express from "express";

import {
    saveAddress,
    getAddresses,
    setDefaultAddress,
    deleteAddress
} from "../controllers/addressController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, saveAddress);
router.get("/", protect, getAddresses);
router.patch("/:id/default", protect, setDefaultAddress);
router.delete("/:id", protect, deleteAddress);

export default router;