import axios from "axios";
import crypto from "crypto";

const getRazorpayConfig = () => {
    const {
        RAZORPAY_KEY_ID,
        RAZORPAY_KEY_SECRET,
        // Support the misspelling that was previously used in the local environment.
        // New deployments must use the correctly spelled RAZORPAY_* variables.
        RAZERPAY_KEY_ID,
        RAZERPAY_KEY_SECRET,
        RAZORPAY_CURRENCY = "INR",
    } = process.env;
    const keyId = RAZORPAY_KEY_ID || RAZERPAY_KEY_ID;
    const keySecret = RAZORPAY_KEY_SECRET || RAZERPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env, then restart the backend.");
    }
    return { keyId, keySecret, currency: RAZORPAY_CURRENCY };
};

const createRazorpayOrder = async ({ amount, receipt }) => {
    const { keyId, keySecret, currency } = getRazorpayConfig();
    const response = await axios.post(
        "https://api.razorpay.com/v1/orders",
        { amount, currency, receipt, payment_capture: 1 },
        { auth: { username: keyId, password: keySecret } }
    );
    return { order: response.data, keyId };
};

const signaturesMatch = (expected, actual) => {
    const expectedBuffer = Buffer.from(expected, "utf8");
    const actualBuffer = Buffer.from(actual || "", "utf8");
    return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
    const { keySecret } = getRazorpayConfig();
    const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
    return signaturesMatch(expected, signature);
};

const verifyWebhookSignature = ({ rawBody, signature }) => {
    const { RAZORPAY_WEBHOOK_SECRET } = process.env;
    if (!RAZORPAY_WEBHOOK_SECRET) throw new Error("Razorpay webhook is not configured. Add RAZORPAY_WEBHOOK_SECRET to the backend environment.");
    const expected = crypto.createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
    return signaturesMatch(expected, signature);
};

export { createRazorpayOrder, verifyRazorpaySignature, verifyWebhookSignature };
