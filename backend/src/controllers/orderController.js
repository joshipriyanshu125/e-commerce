import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";


// CREATE ORDER
export const createOrder = async (req, res) => {
    try {

        const {
            orderItems,
            shippingInfo,
            paymentInfo,
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice
        } = req.body;

        // CHECK STOCK
        for (const item of orderItems) {

            const product = await Product.findById(item.product);

            if (!product) {
                return res.status(404).json({
                    message: `Product not found`
                });
            }

            // CHECK countInStock
            if (product.countInStock < item.quantity) {
                return res.status(400).json({
                    message: `${product.name} is out of stock`
                });
            }
        }

        // CREATE ORDER
        const order = await Order.create({
            user: req.user._id,

            orderItems,

            shippingInfo,

            paymentInfo,

            itemsPrice,

            shippingPrice,

            taxPrice,

            totalPrice
        });

        // REDUCE STOCK
        for (const item of orderItems) {

            const product = await Product.findById(item.product);

            product.countInStock -= item.quantity;

            await product.save();
        }

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};




// GET MY ORDERS
export const getMyOrders = async (req, res) => {
    try {

        const orders = await Order.find({
            user: req.user._id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            orders
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};




// GET SINGLE ORDER
export const getSingleOrder = async (req, res) => {
    try {

        // VALIDATE OBJECT ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findById(req.params.id)
            .populate("user", "name email");

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json({
            success: true,
            order
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};




// ADMIN — GET ALL ORDERS
export const getAllOrders = async (req, res) => {
    try {

        const orders = await Order.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        const totalAmount = orders.reduce(
            (acc, order) => acc + order.totalPrice,
            0
        );

        res.status(200).json({
            success: true,
            totalAmount,
            orders
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};




// ADMIN — UPDATE ORDER STATUS
export const updateOrderStatus = async (req, res) => {
    try {

        // VALIDATE OBJECT ID
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID"
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        order.orderStatus = req.body.status;

        if (req.body.status === "Delivered") {
            order.deliveredAt = Date.now();
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: "Order status updated",
            order
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });
    }
};