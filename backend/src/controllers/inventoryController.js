import asyncHandler from "../middleware/asyncHandler.js";
import Product from "../models/Product.js";
import InventoryHistory from "../models/InventoryHistory.js";
import { logHistory } from "../services/inventoryService.js";
import { deleteCache, clearCachePattern } from "../utils/cache.js";

/*
==================================================
GET /api/admin/inventory
Admin: View complete inventory layout
==================================================
*/
export const getInventory = asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const search = String(req.query.q || "").trim();

    const query = {};
    if (search) {
        const rx = new RegExp(search, "i");
        query.$or = [{ name: rx }, { brand: rx }, { category: rx }];
    }

    const count = await Product.countDocuments(query);
    const products = await Product.find(query)
        .select("name brand category price countInStock variants status")
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

    res.status(200).json({
        success: true,
        products,
        page,
        pages: Math.ceil(count / limit),
        total: count,
    });
});

/*
==================================================
GET /api/admin/inventory/low-stock
Admin: View low stock and out-of-stock items
==================================================
*/
export const getLowStockItems = asyncHandler(async (req, res) => {
    // Find products where root countInStock <= lowStockThreshold (or 0) OR any variant stock <= lowStockThreshold
    const products = await Product.find({
        $or: [
            {
                variants: { $exists: false },
                $expr: { $lte: ["$countInStock", "$lowStockThreshold"] }
            },
            {
                variants: { $size: 0 },
                $expr: { $lte: ["$countInStock", "$lowStockThreshold"] }
            },
            {
                "variants.countInStock": { $lte: 10 } // general query helper, refined below
            }
        ]
    }).select("name brand category variants countInStock lowStockThreshold status").lean();

    const lowStockAlerts = [];

    for (const p of products) {
        if (p.variants && p.variants.length > 0) {
            for (const v of p.variants) {
                const threshold = v.lowStockThreshold || 5;
                if (v.countInStock <= threshold) {
                    lowStockAlerts.push({
                        _id: p._id,
                        name: p.name,
                        brand: p.brand,
                        category: p.category,
                        variantId: v._id,
                        size: v.size,
                        color: v.color,
                        countInStock: v.countInStock,
                        threshold,
                        status: v.countInStock === 0 ? "OUT OF STOCK" : "LOW STOCK",
                    });
                }
            }
        } else {
            const threshold = p.lowStockThreshold || 5;
            if (p.countInStock <= threshold) {
                lowStockAlerts.push({
                    _id: p._id,
                    name: p.name,
                    brand: p.brand,
                    category: p.category,
                    variantId: null,
                    size: "One Size",
                    color: "Default",
                    countInStock: p.countInStock,
                    threshold,
                    status: p.countInStock === 0 ? "OUT OF STOCK" : "LOW STOCK",
                });
            }
        }
    }

    res.status(200).json({
        success: true,
        alerts: lowStockAlerts,
        total: lowStockAlerts.length,
    });
});

/*
==================================================
GET /api/admin/inventory/:productId
Admin: Get specific product's variants and stocks
==================================================
*/
export const getProductInventory = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const product = await Product.findById(productId)
        .select("name brand category countInStock variants lowStockThreshold status");

    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    res.status(200).json({ success: true, product });
});

/*
==================================================
PUT /api/admin/inventory/:variantId
Admin: Update specific variant stock or root stock directly
==================================================
*/
export const updateVariantStock = asyncHandler(async (req, res) => {
    const { variantId } = req.params;
    const { productId, countInStock, lowStockThreshold, sku } = req.body;

    if (!productId) {
        res.status(400);
        throw new Error("productId is required");
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    let prevStock = 0;
    let newStock = 0;
    let size = "";
    let color = "";
    const hasVariants = product.variants && product.variants.length > 0;

    if (variantId !== "root" && hasVariants) {
        const variant = product.variants.id(variantId);
        if (!variant) {
            res.status(404);
            throw new Error("Variant not found");
        }
        prevStock = variant.countInStock;
        if (countInStock !== undefined) variant.countInStock = Number(countInStock);
        if (lowStockThreshold !== undefined) variant.lowStockThreshold = Number(lowStockThreshold);
        if (sku !== undefined) variant.sku = sku;
        newStock = variant.countInStock;
        size = variant.size;
        color = variant.color;
    } else {
        // Update root stock directly
        prevStock = product.countInStock;
        if (countInStock !== undefined) product.countInStock = Number(countInStock);
        if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);
        newStock = product.countInStock;
    }

    // Sync total stock if variants exist
    if (hasVariants) {
        product.countInStock = product.variants.reduce((acc, v) => acc + v.countInStock, 0);
    }

    if (product.countInStock <= 0) {
        product.status = "OutOfStock";
    } else if (product.status === "OutOfStock") {
        product.status = "Active";
    }

    await product.save();

    const change = newStock - prevStock;
    if (change !== 0) {
        await logHistory({
            productId,
            size,
            color,
            quantityChanged: change,
            previousStock: prevStock,
            newStock,
            reason: "Manual Adjustment",
            user: req.user.name,
        });
    }

    await deleteCache(`product_${productId}`);
    await clearCachePattern("all_products*");

    res.status(200).json({
        success: true,
        message: "Inventory updated successfully",
        product,
    });
});

/*
==================================================
POST /api/admin/inventory/restock
Admin: Restock records with supplier and cost logging
==================================================
*/
export const restockProduct = asyncHandler(async (req, res) => {
    const { productId, variantId, quantity, supplier, cost, reason } = req.body;

    if (!productId || quantity === undefined) {
        res.status(400);
        throw new Error("productId and quantity are required");
    }

    const qty = Number(quantity);
    if (qty <= 0) {
        res.status(400);
        throw new Error("Restock quantity must be positive");
    }

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    let prevStock = 0;
    let newStock = 0;
    let size = "";
    let color = "";
    const hasVariants = product.variants && product.variants.length > 0;

    if (variantId && variantId !== "root" && hasVariants) {
        const variant = product.variants.id(variantId);
        if (!variant) {
            res.status(404);
            throw new Error("Variant not found");
        }
        prevStock = variant.countInStock;
        variant.countInStock += qty;
        newStock = variant.countInStock;
        size = variant.size;
        color = variant.color;
    } else {
        prevStock = product.countInStock;
        product.countInStock += qty;
        newStock = product.countInStock;
    }

    if (hasVariants) {
        product.countInStock = product.variants.reduce((acc, v) => acc + v.countInStock, 0);
    }

    if (product.countInStock > 0 && product.status === "OutOfStock") {
        product.status = "Active";
    }

    await product.save();

    await logHistory({
        productId,
        size,
        color,
        quantityChanged: qty,
        previousStock: prevStock,
        newStock,
        reason: reason || "Supplier Restock",
        user: req.user.name,
        supplier: supplier || "",
        cost: Number(cost) || 0,
    });

    await deleteCache(`product_${productId}`);
    await clearCachePattern("all_products*");

    res.status(200).json({
        success: true,
        message: "Restocked successfully",
        product,
    });
});

/*
==================================================
GET /api/admin/inventory/history
Admin: View full stock movements history
==================================================
*/
export const getInventoryHistory = asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);

    const count = await InventoryHistory.countDocuments();
    const history = await InventoryHistory.find()
        .populate("product", "name brand category")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean();

    res.status(200).json({
        success: true,
        history,
        page,
        pages: Math.ceil(count / limit),
        total: count,
    });
});
