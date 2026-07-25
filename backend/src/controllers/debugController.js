import asyncHandler from "../middleware/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";

export const sendTestEmail = asyncHandler(async (req, res) => {
  const to = req.user.email;
  try {
    const info = await sendEmail({
      to,
      subject: 'Test email from Atelier - delivery check',
      html: `<p>This is a test email to check SMTP delivery to <strong>${to}</strong>.</p><p>If you don't receive this, check spam and SMTP settings.</p>`,
    });

    res.status(200).json({ success: true, info });
  } catch (err) {
    console.error('Test email failed', err);
    res.status(500).json({ success: false, message: err.message || 'Send failed', error: err });
  }
});
