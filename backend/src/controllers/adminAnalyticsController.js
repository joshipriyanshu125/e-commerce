import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/userModel.js";

export const getAdminAnalytics = async (req, res) => {
    try {
        // Total Revenue
        const revenueResult = await Order.aggregate([
            {
                $match: {
                    isPaid: true
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: {
                        $sum: "$totalPrice"
                    }
                }
            }
        ]);

        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        // Total Orders
        const totalOrders = await Order.countDocuments();

        // Total Users
        const totalUsers = await User.countDocuments();

        // Total Products
        const totalProducts = await Product.countDocuments();

        // Monthly Sales
        const monthlySales = await Order.aggregate([
            {
                $match: {
                    isPaid: true
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalSales: {
                        $sum: "$totalPrice"
                    }
                }
            },
            {
                $sort: {
                    "_id.year": 1,
                    "_id.month": 1
                }
            }
        ]);

        // Order Status Analytics
        const orderStatusAnalytics = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: {
                        $sum: 1
                    }
                }
            }
        ]);

        // Top Selling Products
        const topProducts = await Order.aggregate([
            {
                $unwind: "$orderItems"
            },
            {
                $group: {
                    _id: "$orderItems.product",
                    totalSold: {
                        $sum: "$orderItems.qty"
                    }
                }
            },
            {
                $sort: {
                    totalSold: -1
                }
            },
            {
                $limit: 5
            },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            },
            {
                $project: {
                    name: "$product.name",
                    image: "$product.image",
                    price: "$product.price",
                    totalSold: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            analytics: {
                totalRevenue,
                totalOrders,
                totalUsers,
                totalProducts,
                monthlySales,
                orderStatusAnalytics,
                topProducts
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};