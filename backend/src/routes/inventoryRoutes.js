import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
    getInventory,
    getProductInventory,
    updateVariantStock,
    restockProduct,
    getInventoryHistory,
    getLowStockItems,
} from "../controllers/inventoryController.js";

const router = express.Router();

// All routes are admin-protected
router.use(protect, admin);

router.get("/", getInventory);
router.get("/low-stock", getLowStockItems);
router.get("/history", getInventoryHistory);
router.get("/:productId", getProductInventory);
router.put("/:variantId", updateVariantStock);
router.post("/restock", restockProduct);

export default router;
