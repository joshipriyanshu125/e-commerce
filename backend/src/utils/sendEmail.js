import { sendEmail as sendManagedEmail } from "../services/emailService.js";

/*
==================================================
SEND EMAIL
==================================================
*/
const sendEmail = async ({
    to,
    subject,
    html,
}) => {
    const result = await sendManagedEmail({ to, subject, html, template: "custom" });
    if (!result.success) throw new Error(result.error || "Unable to send email.");
    return result;
};

export default sendEmail;
