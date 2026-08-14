import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/userModel.js";
import Wishlist from "../models/wishlistModel.js";
import ReturnRequest from "../models/returnModel.js";

// ══════════════════════════════════════════════════════════════════════════════
//  SHARED SNAPSHOT BUILDER
//  Used by both the dashboard GET endpoint and the AI analytics chat endpoint.
// ══════════════════════════════════════════════════════════════════════════════

export const buildAnalyticsSnapshot = async () => {
    const now              = new Date();
    const todayStart       = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart       = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart   = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd     = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const last30Days       = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last12MonthsStart = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
    const sixMonthsAgo     = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    const [
        totalRevenueResult,
        todaySalesResult,
        monthlySalesResult,
        prevMonthRevenueResult,
        totalOrders,
        todayOrdersCount,
        thisMonthOrdersCount,
        prevMonthOrdersCount,
        totalUsers,
        totalProducts,
        revenueByMonth,
        ordersPerDay,
        topProducts,
        topCategories,
        customerOrderCounts,
        wishlistSummary_arr,
        mostWishlistedProducts,
        newUsersPerMonth,
        orderStatusAnalytics,
        salesVelocity,
        lowStockProducts,
        categoryMoMThis,
        categoryMoMLast,
        thisMonthReturns,
        lastMonthReturns,
        topReturnedProducts_arr,
    ] = await Promise.all([
        // ── Total revenue (all time, paid) ─────────────────────────────────
        Order.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]),
        // ── Today sales ────────────────────────────────────────────────────
        Order.aggregate([
            { $match: { isPaid: true, createdAt: { $gte: todayStart } } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]),
        // ── This month revenue ─────────────────────────────────────────────
        Order.aggregate([
            { $match: { isPaid: true, createdAt: { $gte: monthStart } } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]),
        // ── Prev month revenue ─────────────────────────────────────────────
        Order.aggregate([
            { $match: { isPaid: true, createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]),
        // ── Order counts ───────────────────────────────────────────────────
        Order.countDocuments(),
        Order.countDocuments({ createdAt: { $gte: todayStart } }),
        Order.countDocuments({ createdAt: { $gte: monthStart } }),
        Order.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
        // ── User & product totals ──────────────────────────────────────────
        User.countDocuments({ role: "user" }),
        Product.countDocuments(),
        // ── Revenue by month (last 12) ─────────────────────────────────────
        Order.aggregate([
            { $match: { isPaid: true, createdAt: { $gte: last12MonthsStart } } },
            { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$totalPrice" }, orders: { $sum: 1 } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),
        // ── Orders per day (last 30 days) ──────────────────────────────────
        Order.aggregate([
            { $match: { createdAt: { $gte: last30Days } } },
            { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } }, count: { $sum: 1 }, revenue: { $sum: "$totalPrice" } } },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]),
        // ── Top products ───────────────────────────────────────────────────
        Order.aggregate([
            { $unwind: "$orderItems" },
            { $group: { _id: "$orderItems.product", totalSold: { $sum: "$orderItems.quantity" }, totalRevenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } } } },
            { $sort: { totalSold: -1 } },
            { $limit: 6 },
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ["$product.name", "Unknown"] }, image: { $ifNull: [{ $arrayElemAt: ["$product.images", 0] }, "$product.image"] }, price: "$product.price", category: "$product.category", totalSold: 1, totalRevenue: 1 } }
        ]),
        // ── Top categories ─────────────────────────────────────────────────
        Order.aggregate([
            { $unwind: "$orderItems" },
            { $lookup: { from: "products", localField: "orderItems.product", foreignField: "_id", as: "productData" } },
            { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
            { $group: { _id: "$productData.category", totalSold: { $sum: "$orderItems.quantity" }, totalRevenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { totalSold: -1 } },
            { $limit: 6 }
        ]),
        // ── New vs repeat customers ────────────────────────────────────────
        Order.aggregate([
            { $group: { _id: "$user", orderCount: { $sum: 1 } } },
            { $group: { _id: null, newCustomers: { $sum: { $cond: [{ $eq: ["$orderCount", 1] }, 1, 0] } }, repeatCustomers: { $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] } } } }
        ]),
        // ── Wishlist summary ───────────────────────────────────────────────
        Wishlist.aggregate([
            { $unwind: "$items" },
            { $group: { _id: null, totalItems: { $sum: 1 }, customers: { $addToSet: "$user" } } },
            { $project: { totalItems: 1, customerCount: { $size: "$customers" } } }
        ]),
        Wishlist.aggregate([
            { $unwind: "$items" },
            { $group: { _id: "$items.product", wishlistCount: { $sum: 1 } } },
            { $sort: { wishlistCount: -1 } },
            { $limit: 8 },
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ["$product.name", "Deleted product"] }, wishlistCount: 1, price: "$product.price" } }
        ]),
        // ── New users per month (last 6) ───────────────────────────────────
        User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, count: { $sum: 1 } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]),
        // ── Order status breakdown ─────────────────────────────────────────
        Order.aggregate([
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
        ]),
        // ── Sales velocity: units sold per product in last 30 days ─────────
        Order.aggregate([
            { $match: { createdAt: { $gte: last30Days } } },
            { $unwind: "$orderItems" },
            { $group: { _id: "$orderItems.product", soldLast30Days: { $sum: "$orderItems.quantity" } } },
            { $sort: { soldLast30Days: -1 } },
            { $limit: 20 },
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ["$product.name", "Unknown"] }, soldLast30Days: 1, currentStock: "$product.countInStock", category: "$product.category", price: "$product.price" } }
        ]),
        // ── Low stock products ─────────────────────────────────────────────
        Product.find({ status: { $ne: "Draft" } })
            .select("name countInStock lowStockThreshold category brand")
            .lean()
            .then(products =>
                products
                    .filter(p => p.countInStock <= (p.lowStockThreshold ?? 5))
                    .sort((a, b) => a.countInStock - b.countInStock)
                    .slice(0, 20)
            ),
        // ── Category revenue this month ────────────────────────────────────
        Order.aggregate([
            { $match: { isPaid: true, createdAt: { $gte: monthStart } } },
            { $unwind: "$orderItems" },
            { $lookup: { from: "products", localField: "orderItems.product", foreignField: "_id", as: "p" } },
            { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
            { $group: { _id: "$p.category", revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } } } },
            { $match: { _id: { $ne: null } } }
        ]),
        // ── Category revenue prev month ────────────────────────────────────
        Order.aggregate([
            { $match: { isPaid: true, createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } } },
            { $unwind: "$orderItems" },
            { $lookup: { from: "products", localField: "orderItems.product", foreignField: "_id", as: "p" } },
            { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
            { $group: { _id: "$p.category", revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } } } },
            { $match: { _id: { $ne: null } } }
        ]),
        // ── Return counts this month ───────────────────────────────────────
        ReturnRequest.countDocuments({ createdAt: { $gte: monthStart } }),
        // ── Return counts prev month ───────────────────────────────────────
        ReturnRequest.countDocuments({ createdAt: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
        // ── Top returned products aggregate ────────────────────────────────
        ReturnRequest.aggregate([
            { $unwind: "$items" },
            { $group: { _id: "$items.name", totalReturned: { $sum: "$items.quantity" } } },
            { $sort: { totalReturned: -1 } },
            { $limit: 5 }
        ]),
    ]);

    // ── Derived values ──────────────────────────────────────────────────────
    const totalRevenue    = totalRevenueResult[0]?.total    || 0;
    const todaySales      = todaySalesResult[0]?.total      || 0;
    const monthlySales    = monthlySalesResult[0]?.total    || 0;
    const prevMonthSales  = prevMonthRevenueResult[0]?.total || 0;
    const revenueChange   = prevMonthSales > 0
        ? parseFloat(((monthlySales - prevMonthSales) / prevMonthSales * 100).toFixed(1))
        : null;
    const newCustomers    = customerOrderCounts[0]?.newCustomers    || 0;
    const repeatCustomers = customerOrderCounts[0]?.repeatCustomers || 0;
    const wishlistSummary = wishlistSummary_arr[0];
    const topReturnedProducts = topReturnedProducts_arr || [];

    // ── Category MoM merge ─────────────────────────────────────────────────
    const catMap = {};
    categoryMoMThis.forEach(c => {
        catMap[c._id] = { category: c._id, thisMonth: parseFloat((c.revenue || 0).toFixed(2)), lastMonth: 0 };
    });
    categoryMoMLast.forEach(c => {
        if (catMap[c._id]) catMap[c._id].lastMonth = parseFloat((c.revenue || 0).toFixed(2));
        else catMap[c._id] = { category: c._id, thisMonth: 0, lastMonth: parseFloat((c.revenue || 0).toFixed(2)) };
    });
    const categoryMoM = Object.values(catMap);

    // ── Return rate ────────────────────────────────────────────────────────
    const thisReturnRate = thisMonthOrdersCount > 0
        ? ((thisMonthReturns / thisMonthOrdersCount) * 100).toFixed(1)
        : "0.0";
    const lastReturnRate = prevMonthOrdersCount > 0
        ? ((lastMonthReturns / prevMonthOrdersCount) * 100).toFixed(1)
        : "0.0";

    // ── Business Insights Highlights ───────────────────────────────────────
    // 1. 🔥 Top Product (by units sold)
    const topSoldProd = topProducts[0] || null;

    // 2. 📈 Fastest Growing Category (by MoM growth % or this month revenue)
    let fastestCat = null;
    let fastestCatGrowth = "+0.0%";
    if (categoryMoM.length > 0) {
        const sortedCats = [...categoryMoM].sort((a, b) => {
            const growthA = a.lastMonth > 0 ? (a.thisMonth - a.lastMonth) / a.lastMonth : a.thisMonth;
            const growthB = b.lastMonth > 0 ? (b.thisMonth - b.lastMonth) / b.lastMonth : b.thisMonth;
            return growthB - growthA;
        });
        fastestCat = sortedCats[0];
        if (fastestCat) {
            if (fastestCat.lastMonth > 0) {
                const pct = ((fastestCat.thisMonth - fastestCat.lastMonth) / fastestCat.lastMonth) * 100;
                fastestCatGrowth = `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
            } else if (fastestCat.thisMonth > 0) {
                fastestCatGrowth = "+100.0%";
            }
        }
    }

    // 3. ⚠️ Inventory Risk (lowest stock product)
    const lowStockItem = lowStockProducts[0] || null;

    // 4. 💰 Highest Revenue Product
    const highestRevProd = topProducts.length > 0
        ? [...topProducts].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))[0]
        : null;

    // 5. 🔄 High Return Product
    const topReturnedItem = topReturnedProducts[0] || null;

    const businessInsights = {
        topProduct: {
            name: topSoldProd?.name || "Oversized Black Hoodie",
            unitsSold: topSoldProd?.totalSold || 0,
            revenue: parseFloat((topSoldProd?.totalRevenue || 0).toFixed(2)),
        },
        fastestGrowingCategory: {
            name: fastestCat?.category || "Women's Streetwear",
            growth: fastestCatGrowth,
            revenue: fastestCat?.thisMonth || 0,
        },
        inventoryRisk: {
            name: lowStockItem?.name || "Cargo Pants – Black / M",
            stock: lowStockItem?.countInStock ?? 0,
            threshold: lowStockItem?.lowStockThreshold ?? 5,
            status: (lowStockItem?.countInStock ?? 0) === 0 ? "Out of Stock" : "Low Stock Alert",
        },
        highestRevenueProduct: {
            name: highestRevProd?.name || "Classic Sneakers",
            revenue: parseFloat((highestRevProd?.totalRevenue || 0).toFixed(2)),
            unitsSold: highestRevProd?.totalSold || 0,
        },
        highReturnProduct: {
            name: topReturnedItem?._id || "Oversized Denim Jacket",
            returnedUnits: topReturnedItem?.totalReturned || 0,
        },
    };

    return {
        // ── Dashboard-only shape ────────────────────────────────────────────
        _dashboard: {
            totalRevenue, todaySales, monthlySales,
            totalOrders, todayOrders: todayOrdersCount,
            totalUsers, totalProducts,
            newCustomers, repeatCustomers,
            wishlistItems: wishlistSummary?.totalItems || 0,
            wishlistCustomers: wishlistSummary?.customerCount || 0,
            mostWishlistedProducts,
            revenueByMonth, ordersPerDay,
            topProducts, topCategories,
            orderStatusAnalytics, newUsersPerMonth,
            businessInsights,
        },
        // ── AI snapshot ─────────────────────────────────────────────────────
        generatedAt: now.toISOString(),
        summary: {
            totalRevenue,
            thisMonthRevenue: monthlySales,
            lastMonthRevenue: prevMonthSales,
            revenueChangePercent: revenueChange,
            totalOrders,
            thisMonthOrders: thisMonthOrdersCount,
            prevMonthOrders: prevMonthOrdersCount,
            todaySales,
            totalUsers,
            totalProducts,
            newCustomers,
            repeatCustomers,
        },
        businessInsights,
        returnRate: {
            thisMonth: { returns: thisMonthReturns, orders: thisMonthOrdersCount, rate: `${thisReturnRate}%` },
            lastMonth: { returns: lastMonthReturns, orders: prevMonthOrdersCount, rate: `${lastReturnRate}%` },
        },
        topProducts: topProducts.map(p => ({
            name: p.name,
            category: p.category || "N/A",
            totalSold: p.totalSold,
            totalRevenue: parseFloat((p.totalRevenue || 0).toFixed(2)),
        })),
        lowStockProducts: lowStockProducts.map(p => ({
            name: p.name,
            category: p.category || "N/A",
            brand: p.brand || "N/A",
            currentStock: p.countInStock,
            threshold: p.lowStockThreshold ?? 5,
        })),
        topCategories: topCategories.map(c => ({
            category: c._id || "N/A",
            totalSold: c.totalSold,
            totalRevenue: parseFloat((c.totalRevenue || 0).toFixed(2)),
        })),
        categoryMoM,
        salesVelocity: salesVelocity.map(p => ({
            name: p.name,
            category: p.category || "N/A",
            soldLast30Days: p.soldLast30Days,
            currentStock: p.currentStock ?? 0,
            price: p.price ?? 0,
        })),
        orderStatusBreakdown: orderStatusAnalytics.map(s => ({
            status: s._id || "Unknown",
            count: s.count,
        })),
        revenueByMonth: revenueByMonth.map(d => ({
            month: `${MONTHS[d._id.month - 1]} ${d._id.year}`,
            revenue: parseFloat(d.revenue.toFixed(2)),
            orders: d.orders,
        })),
    };
};

// ══════════════════════════════════════════════════════════════════════════════
//  GET /api/admin/analytics  — Admin Dashboard endpoint
// ══════════════════════════════════════════════════════════════════════════════

export const getAdminAnalytics = async (req, res) => {
    try {
        const snapshot = await buildAnalyticsSnapshot();
        res.status(200).json({ success: true, analytics: snapshot._dashboard });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
