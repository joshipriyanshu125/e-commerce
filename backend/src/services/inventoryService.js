import Product from "../models/Product.js";
import InventoryHistory from "../models/InventoryHistory.js";
import logger from "../utils/logger.js";

// ─── LOG STOCK HISTORY ────────────────────────────────────────────────────────
export const logHistory = async ({
    productId,
    size = "",
    color = "",
    quantityChanged,
    previousStock,
    newStock,
    reason,
    user = "System",
    supplier = "",
    cost = 0,
}) => {
    try {
        await InventoryHistory.create({
            product: productId,
            size,
            color,
            quantityChanged,
            previousStock,
            newStock,
            reason,
            user,
            supplier,
            cost,
        });
    } catch (err) {
        logger.error({ message: "Failed to write inventory history log", error: err.message });
    }
};

// ─── UPDATE TOTAL STOCK COUNTER ───────────────────────────────────────────────
// Root countInStock is synchronized as the sum of all variant stocks
const syncProductTotalStock = (product) => {
    if (product.variants && product.variants.length > 0) {
        product.countInStock = product.variants.reduce((acc, v) => acc + v.countInStock, 0);
    }
    // Update status if needed
    if (product.countInStock <= 0) {
        product.status = "OutOfStock";
    } else if (product.status === "OutOfStock") {
        product.status = "Active";
    }
};

// ─── DECREASE STOCK ───────────────────────────────────────────────────────────
// Invoked when an order is placed. Throws error if stock is insufficient.
export const decreaseStock = async (productId, size, color, qty, orderNumber, userName = "System") => {
    const product = await Product.findById(productId);
    if (!product) throw new Error(`Product not found: ${productId}`);

    let prevStock = 0;
    let newStock = 0;

    const hasVariants = product.variants && product.variants.length > 0;
    const matchSize = (size || "").trim().toLowerCase();
    const matchColor = (color || "").trim().toLowerCase();

    if (hasVariants) {
        const variant = product.variants.find(
            (v) => (v.size || "").trim().toLowerCase() === matchSize &&
                   (v.color || "").trim().toLowerCase() === matchColor
        );
        if (!variant) {
            throw new Error(`Variant color: ${color}, size: ${size} not found for product: ${product.name}`);
        }
        if (variant.countInStock < qty) {
            throw new Error(`Insufficient stock for ${product.name} (variant: ${color}/${size}). Requested: ${qty}, Available: ${variant.countInStock}`);
        }
        prevStock = variant.countInStock;
        variant.countInStock -= qty;
        newStock = variant.countInStock;
    } else {
        // Fallback to root stock
        if (product.countInStock < qty) {
            throw new Error(`Insufficient stock for ${product.name}. Requested: ${qty}, Available: ${product.countInStock}`);
        }
        prevStock = product.countInStock;
        product.countInStock -= qty;
        newStock = product.countInStock;
    }

    syncProductTotalStock(product);
    await product.save();

    await logHistory({
        productId,
        size: hasVariants ? size : "",
        color: hasVariants ? color : "",
        quantityChanged: -qty,
        previousStock: prevStock,
        newStock,
        reason: `Order #${orderNumber}`,
        user: userName,
    });
};

// ─── INCREASE STOCK (RESTORE) ──────────────────────────────────────────────────
// Invoked during cancellations/returns
export const increaseStock = async (productId, size, color, qty, reason, userName = "System") => {
    const product = await Product.findById(productId);
    if (!product) {
        logger.warn({ message: `Product not found for stock restoration: ${productId}` });
        return;
    }

    let prevStock = 0;
    let newStock = 0;
    const hasVariants = product.variants && product.variants.length > 0;
    const matchSize = (size || "").trim().toLowerCase();
    const matchColor = (color || "").trim().toLowerCase();

    if (hasVariants) {
        const variant = product.variants.find(
            (v) => (v.size || "").trim().toLowerCase() === matchSize &&
                   (v.color || "").trim().toLowerCase() === matchColor
        );
        if (!variant) {
            // If variant was somehow deleted or layout changed, create a new one to receive stock
            product.variants.push({
                size,
                color,
                countInStock: qty,
            });
            prevStock = 0;
            newStock = qty;
        } else {
            prevStock = variant.countInStock;
            variant.countInStock += qty;
            newStock = variant.countInStock;
        }
    } else {
        prevStock = product.countInStock;
        product.countInStock += qty;
        newStock = product.countInStock;
    }

    syncProductTotalStock(product);
    await product.save();

    await logHistory({
        productId,
        size: hasVariants ? size : "",
        color: hasVariants ? color : "",
        quantityChanged: qty,
        previousStock: prevStock,
        newStock,
        reason,
        user: userName,
    });
};

// ─── VALIDATE STOCK BEFORE CHECKOUT ──────────────────────────────────────────
// Checks product availability. Returns { valid: true } or throws custom error.
export const validateStock = async (productId, size, color, qty) => {
    const product = await Product.findById(productId).lean();
    if (!product) throw new Error("Product not found");

    if (product.status === "Draft") {
        throw new Error(`${product.name} is currently unavailable`);
    }

    const hasVariants = product.variants && product.variants.length > 0;
    const matchSize = (size || "").trim().toLowerCase();
    const matchColor = (color || "").trim().toLowerCase();

    if (hasVariants) {
        const variant = product.variants.find(
            (v) => (v.size || "").trim().toLowerCase() === matchSize &&
                   (v.color || "").trim().toLowerCase() === matchColor
        );
        if (!variant) {
            throw new Error(`Variant ${color}/${size} is unavailable for ${product.name}`);
        }
        if (variant.countInStock < qty) {
            throw new Error(`Insufficient stock for ${product.name} (${color}/${size}). Only ${variant.countInStock} item(s) left.`);
        }
    } else {
        if (product.countInStock < qty) {
            throw new Error(`Insufficient stock for ${product.name}. Only ${product.countInStock} item(s) left.`);
        }
    }
    return true;
};
