/*
==================================================
ORDER CONFIRMATION EMAIL
==================================================
*/
export const orderConfirmationTemplate = (userName, orderId) => {
    return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:8px;">
        <h2 style="color:#28a745;">🎉 Order Confirmed</h2>

        <p>Hello <strong>${userName}</strong>,</p>

        <p>
            Thank you for shopping with us.
            Your order has been placed successfully.
        </p>

        <p>
            <strong>Order ID:</strong> ${orderId}
        </p>

        <hr>

        <p>
            We will notify you once your order has been shipped.
        </p>

        <p>
            Thanks,<br>
            <strong>E-Commerce Team</strong>
        </p>
    </div>
    `;
};

/*
==================================================
ORDER DELIVERED EMAIL
==================================================
*/
export const orderDeliveredTemplate = (userName, orderId) => {
    return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:8px;">
        <h2 style="color:#007bff;">📦 Order Delivered</h2>

        <p>Hello <strong>${userName}</strong>,</p>

        <p>
            Your order has been delivered successfully.
        </p>

        <p>
            <strong>Order ID:</strong> ${orderId}
        </p>

        <hr>

        <p>
            Thank you for shopping with us.
            We hope you enjoy your purchase.
        </p>

        <p>
            Regards,<br>
            <strong>E-Commerce Team</strong>
        </p>
    </div>
    `;
};

/*
==================================================
PASSWORD RESET EMAIL
==================================================
*/
export const passwordResetTemplate = (resetLink) => {
    return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width:600px; margin:auto; padding:20px; border:1px solid #ddd; border-radius:8px;">
        <h2>Password Reset</h2>

        <p>
            We received a request to reset your password.
        </p>

        <p>
            Click the button below to continue.
        </p>

        <a
            href="${resetLink}"
            style="
                display:inline-block;
                padding:12px 20px;
                background:#007bff;
                color:#ffffff;
                text-decoration:none;
                border-radius:5px;
            "
        >
            Reset Password
        </a>

        <p style="margin-top:20px;">
            If you did not request this, you can safely ignore this email.
        </p>

        <p>
            Thanks,<br>
            <strong>E-Commerce Team</strong>
        </p>
    </div>
    `;
};