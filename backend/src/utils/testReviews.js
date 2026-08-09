import "../config/env.js";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { verifyPurchase, recalculateProductRating } from "../services/reviewService.js";

async function runTest() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");

    try {
        // 1. Create/find dummy user
        let user = await User.findOne({ email: "testuser@example.com" });
        if (!user) {
            user = await User.create({
                name: "Test User",
                email: "testuser@example.com",
                password: "password123",
            });
        }
        console.log("User ready:", user._id);

        // 2. Create/find dummy product
        let product = await Product.findOne({ name: "Test Review Hoodie" });
        if (!product) {
            product = await Product.create({
                name: "Test Review Hoodie",
                description: "Test hoodie description for reviews testing",
                price: 89.99,
                countInStock: 20,
                category: "Hoodies",
                brand: "Atelier",
                user: user._id,
            });
        }
        console.log("Product ready:", product._id);

        // 3. Test verifyPurchase behavior (non-purchaser attempt)
        console.log("Testing verifyPurchase for non-purchaser...");
        await Order.deleteMany({ user: user._id, "orderItems.product": product._id });
        let isVerified = await verifyPurchase(user._id, product._id);
        console.log("Non-purchaser verified purchase status:", isVerified, "(Expected: false)");
        if (isVerified !== false) throw new Error("Non-purchaser should not be verified!");

        // 4. Create an order with status 'Delivered' containing the product
        console.log("Creating Delivered order for product...");
        const order = await Order.create({
            user: user._id,
            orderItems: [
                {
                    product: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    size: "M",
                    color: "Black",
                }
            ],
            shippingInfo: {
                fullName: "Test User",
                phone: "1234567890",
                address: "123 Test St",
                city: "Test City",
                state: "Test State",
                postalCode: "12345",
                country: "Test Country",
            },
            itemsPrice: product.price,
            totalPrice: product.price + 10,
            orderStatus: "Delivered",
            isPaid: true,
        });
        console.log("Delivered order created:", order._id);

        // 5. Test verifyPurchase behavior (actual purchaser)
        console.log("Testing verifyPurchase for actual purchaser...");
        isVerified = await verifyPurchase(user._id, product._id);
        console.log("Purchaser verified purchase status:", isVerified, "(Expected: true)");
        if (isVerified !== true) throw new Error("Purchaser with Delivered order should be verified!");

        // 6. Test rating recalculation
        console.log("Testing rating recalculation...");
        product.reviews = [
            {
                user: user._id,
                name: user.name,
                rating: 5,
                comment: "Excellent hoodie!",
                status: "Approved",
            },
            {
                user: new mongoose.Types.ObjectId(),
                name: "Another User",
                rating: 3,
                comment: "Average hoodie",
                status: "Approved",
            },
            {
                user: new mongoose.Types.ObjectId(),
                name: "Spammer",
                rating: 1,
                comment: "Terrible!",
                status: "Pending", // Should not count in recalculation
            }
        ];
        recalculateProductRating(product);
        console.log("Recalculated rating:", product.rating, "(Expected: 4)");
        console.log("Recalculated numReviews:", product.numReviews, "(Expected: 2)");
        if (product.rating !== 4 || product.numReviews !== 2) {
            throw new Error("Rating recalculation is incorrect!");
        }

        // Clean up test data
        await Order.findByIdAndDelete(order._id);
        await Product.findByIdAndDelete(product._id);
        await User.findByIdAndDelete(user._id);
        console.log("All tests passed successfully!");
    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await mongoose.connection.close();
        console.log("MongoDB connection closed.");
    }
}

runTest();
