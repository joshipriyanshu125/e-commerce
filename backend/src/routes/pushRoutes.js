import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { subscribePush, unsubscribePush } from "../controllers/pushController.js";

const router = express.Router();

router.post("/subscribe", protect, subscribePush);
router.post("/unsubscribe", protect, unsubscribePush);

export default router;
