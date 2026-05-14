export const orderConfirmationTemplate = (
    userName,
    orderId
) => {
    return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Order Confirmed 🎉</h2>

      <p>Hello ${userName},</p>

      <p>Your order has been successfully placed.</p>

      <h3>Order ID: ${orderId}</h3>

      <p>Thank you for shopping with us.</p>
    </div>
  `;
};

export const orderDeliveredTemplate = (
    userName,
    orderId
) => {
    return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Order Delivered 🚚</h2>

      <p>Hello ${userName},</p>

      <p>Your order ${orderId} has been delivered successfully.</p>

      <p>We hope you enjoy your purchase!</p>

      <p>Thank you for shopping with us.</p>
    </div>
  `;
};

export const passwordResetTemplate = (
    resetLink
) => {
    return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Password Reset</h2>

      <p>Click below to reset your password:</p>

      <a href="${resetLink}">
        Reset Password
      </a>
    </div>
  `;
};