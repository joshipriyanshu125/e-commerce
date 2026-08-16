import Order from "../models/Order.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { createCheckoutOrder, verifyCheckoutPayment, markOrderPaid } from "../services/razorpayCheckoutService.js";
import { verifyWebhookSignature } from "../services/razorpayService.js";

const createOrder = asyncHandler(async (req, res) => {
    const { localOrder, razorpayOrder, keyId } = await createCheckoutOrder({ ...req.body, user: req.user });
    res.status(201).json({ success: true, order: { id: localOrder._id, totalPrice: localOrder.totalPrice }, razorpayOrder, keyId });
});

const verifyPayment = asyncHandler(async (req, res) => {
    const order = await verifyCheckoutPayment({
        user: req.user, localOrderId: req.body.orderId, paymentId: req.body.razorpay_payment_id,
        razorpayOrderId: req.body.razorpay_order_id, signature: req.body.razorpay_signature,
    });
    res.status(200).json({ success: true, message: "Payment verified", order: { id: order._id } });
});

const handleWebhook = async (req, res) => {
    try {
        const rawBody = req.body;
        if (!verifyWebhookSignature({ rawBody, signature: req.headers["x-razorpay-signature"] })) {
            return res.status(400).json({ success: false, message: "Invalid webhook signature" });
        }
        const event = JSON.parse(rawBody.toString("utf8"));
        if (event.event === "payment.captured") {
            const payment = event.payload?.payment?.entity;
            const order = await Order.findOne({ "paymentInfo.razorpayOrderId": payment?.order_id });
            if (order) await markOrderPaid({ order, paymentId: payment.id, signature: "webhook" });
        }
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Razorpay webhook error:", error.message);
        return res.status(500).json({ success: false });
    }
};

export { createOrder, verifyPayment, handleWebhook };
