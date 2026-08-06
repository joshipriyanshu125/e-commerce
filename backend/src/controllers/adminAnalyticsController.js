import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/userModel.js";
import Wishlist from "../models/wishlistModel.js";

export const getAdminAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last12MonthsStart = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);

        // ── SUMMARY STATS ──────────────────────────────────────────────
        const [
            totalRevenueResult,
            todaySalesResult,
            monthlySalesResult,
            totalOrders,
            todayOrdersCount,
            totalUsers,
            totalProducts,
        ] = await Promise.all([
            Order.aggregate([
                { $match: { isPaid: true } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Order.aggregate([
                { $match: { isPaid: true, createdAt: { $gte: todayStart } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Order.aggregate([
                { $match: { isPaid: true, createdAt: { $gte: monthStart } } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } }
            ]),
            Order.countDocuments(),
            Order.countDocuments({ createdAt: { $gte: todayStart } }),
            User.countDocuments({ role: "user" }),
            Product.countDocuments(),
        ]);

        const totalRevenue = totalRevenueResult[0]?.total || 0;
        const todaySales = todaySalesResult[0]?.total || 0;
        const monthlySales = monthlySalesResult[0]?.total || 0;

        // ── REVENUE BY MONTH (last 12 months) ─────────────────────────
        const revenueByMonth = await Order.aggregate([
            {
                $match: {
                    isPaid: true,
                    createdAt: { $gte: last12MonthsStart }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    revenue: { $sum: "$totalPrice" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // ── ORDERS PER DAY (last 30 days) ─────────────────────────────
        const ordersPerDay = await Order.aggregate([
            { $match: { createdAt: { $gte: last30Days } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: "$totalPrice" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
        ]);

        // ── TOP PRODUCTS ───────────────────────────────────────────────
        const topProducts = await Order.aggregate([
            { $unwind: "$orderItems" },
            {
                $group: {
                    _id: "$orderItems.product",
                    totalSold: { $sum: "$orderItems.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 6 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    name: { $ifNull: ["$product.name", "Unknown"] },
                    image: { $ifNull: [{ $arrayElemAt: ["$product.images", 0] }, "$product.image"] },
                    price: "$product.price",
                    totalSold: 1,
                    totalRevenue: 1
                }
            }
        ]);

        // ── TOP CATEGORIES ─────────────────────────────────────────────
        const topCategories = await Order.aggregate([
            { $unwind: "$orderItems" },
            {
                $lookup: {
                    from: "products",
                    localField: "orderItems.product",
                    foreignField: "_id",
                    as: "productData"
                }
            },
            { $unwind: { path: "$productData", preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: "$productData.category",
                    totalSold: { $sum: "$orderItems.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
                }
            },
            { $match: { _id: { $ne: null } } },
            { $sort: { totalSold: -1 } },
            { $limit: 6 }
        ]);

        // ── NEW vs REPEAT CUSTOMERS ────────────────────────────────────
        const customerOrderCounts = await Order.aggregate([
            {
                $group: {
                    _id: "$user",
                    orderCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    newCustomers: { $sum: { $cond: [{ $eq: ["$orderCount", 1] }, 1, 0] } },
                    repeatCustomers: { $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] } }
                }
            }
        ]);

        const newCustomers = customerOrderCounts[0]?.newCustomers || 0;
        const repeatCustomers = customerOrderCounts[0]?.repeatCustomers || 0;

        const [wishlistSummary] = await Wishlist.aggregate([
            { $unwind: "$items" }, { $group: { _id: null, totalItems: { $sum: 1 }, customers: { $addToSet: "$user" } } },
            { $project: { totalItems: 1, customerCount: { $size: "$customers" } } }
        ]);
        const mostWishlistedProducts = await Wishlist.aggregate([
            { $unwind: "$items" }, { $group: { _id: "$items.product", wishlistCount: { $sum: 1 } } }, { $sort: { wishlistCount: -1 } }, { $limit: 8 },
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } }, { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ["$product.name", "Deleted product"] }, wishlistCount: 1, price: "$product.price" } }
        ]);

        // ── NEW USERS per month (last 6 months) ───────────────────────
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const newUsersPerMonth = await User.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // ── ORDER STATUS BREAKDOWN ─────────────────────────────────────
        const orderStatusAnalytics = await Order.aggregate([
            {
                $group: {
                    _id: "$orderStatus",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            analytics: {
                // Summary cards
                totalRevenue,
                todaySales,
                monthlySales,
                totalOrders,
                todayOrders: todayOrdersCount,
                totalUsers,
                totalProducts,
                newCustomers,
                repeatCustomers,
                wishlistItems: wishlistSummary?.totalItems || 0,
                wishlistCustomers: wishlistSummary?.customerCount || 0,
                mostWishlistedProducts,
                // Charts
                revenueByMonth,
                ordersPerDay,
                topProducts,
                topCategories,
                orderStatusAnalytics,
                newUsersPerMonth,
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
