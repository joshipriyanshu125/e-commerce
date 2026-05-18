const processPaymentService = async (
    paymentData
) => {

    // STRIPE / RAZORPAY LOGIC LATER

    return {
        success: true,
        transactionId:
            "TXN_" + Date.now(),
    };
};

export {
    processPaymentService,
};