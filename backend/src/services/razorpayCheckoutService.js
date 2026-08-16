import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/cartModel.js";
import { decreaseStock, validateStock } from "./inventoryService.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "./razorpayService.js";

const shippingFor = (itemsPrice) => (itemsPrice >= 150 ? 0 : 15);

const createCheckoutOrder = async ({ user, orderItems, shippingInfo, addressId }) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) throw new Error("Order items are required");
    if (!shippingInfo?.fullName || !shippingInfo?.address || !shippingInfo?.city || !shippingInfo?.postalCode || !shippingInfo?.phone) {
        throw new Error("A complete shipping address is required");
    }

    const normalizedItems = [];
    let itemsPrice = 0;
    for (const item of orderItems) {
        if (!mongoose.Types.ObjectId.isValid(item.product) || !Number.isInteger(item.quantity) || item.quantity < 1) {
            throw new Error("One or more cart items are invalid");
        }
        const product = await Product.findById(item.product);
        if (!product || product.status !== "Active") throw new Error("A product in your cart is no longer available");
        await validateStock(product._id, item.size || "N/A", item.color || "N/A", item.quantity);

        const unitPrice = product.discountPrice ?? product.price;
        itemsPrice += unitPrice * item.quantity;
        normalizedItems.push({
            product: product._id, name: product.name, image: product.images?.[0]?.url || "",
            price: unitPrice, quantity: item.quantity, size: item.size || "N/A", color: item.color || "N/A",
        });
    }

    const shippingPrice = shippingFor(itemsPrice);
    const totalPrice = Number((itemsPrice + shippingPrice).toFixed(2));
    const localOrder = await Order.create({
        user: user._id, orderItems: normalizedItems, shippingInfo, shippingAddress: addressId || undefined,
        itemsPrice, shippingPrice, taxPrice: 0, totalPrice,
        paymentInfo: { method: "Razorpay", paymentStatus: "Pending" }, orderStatus: "Pending",
        trackingHistory: [{ status: "Pending", note: "Awaiting Razorpay payment", updatedBy: "system" }],
    });

    try {
        const { order: razorpayOrder, keyId } = await createRazorpayOrder({
            amount: Math.round(totalPrice * 100), receipt: `local_${localOrder._id}`,
        });
        localOrder.paymentInfo.razorpayOrderId = razorpayOrder.id;
        await localOrder.save();
        return { localOrder, razorpayOrder, keyId };
    } catch (error) {
        await localOrder.deleteOne();
        throw new Error(error.response?.data?.error?.description || "Unable to start Razorpay checkout");
    }
};

const markOrderPaid = async ({ order, paymentId, signature }) => {
    if (order.isPaid) return order;
    for (const item of order.orderItems) {
        await decreaseStock(item.product, item.size, item.color, item.quantity, order._id, "Razorpay payment");
    }
    order.isPaid = true;
    order.paymentInfo.paymentStatus = "Paid";
    order.paymentInfo.transactionId = paymentId;
    order.paymentInfo.razorpayPaymentId = paymentId;
    order.paymentInfo.razorpaySignature = signature;
    order.paymentInfo.paidAt = new Date();
    order.trackingHistory.push({ status: "Pending", note: "Razorpay payment captured", updatedBy: "system" });
    await order.save();
    await Cart.updateOne({ user: order.user }, { $set: { items: [], totalPrice: 0 } });
    return order;
};

const verifyCheckoutPayment = async ({ user, localOrderId, paymentId, razorpayOrderId, signature }) => {
    const order = await Order.findOne({ _id: localOrderId, user: user._id });
    if (!order) throw new Error("Order not found");
    if (order.paymentInfo?.razorpayOrderId !== razorpayOrderId) throw new Error("Payment order does not match this checkout");
    if (!verifyRazorpaySignature({ orderId: order.paymentInfo.razorpayOrderId, paymentId, signature })) {
        throw new Error("Payment signature verification failed");
    }
    return markOrderPaid({ order, paymentId, signature });
};

export { createCheckoutOrder, verifyCheckoutPayment, markOrderPaid };
