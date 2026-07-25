import nodemailer from "nodemailer";

/*
==================================================
CREATE TRANSPORTER
==================================================
*/
const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || undefined,

    host: process.env.SMTP_HOST,

    port: Number(process.env.SMTP_PORT) || 587,

    secure: Number(process.env.SMTP_PORT) === 465,

    auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD,
    },

    tls: {
        rejectUnauthorized:
            process.env.NODE_ENV === "production",
    },
});

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
    try {

        // Verify SMTP Connection
        await transporter.verify();

        const info = await transporter.sendMail({

            from: process.env.SMTP_FROM_NAME
                ? `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_MAIL}>`
                : process.env.SMTP_MAIL,

            to,

            subject,

            html,
        });

        console.log("==================================");
        console.log("EMAIL SENT SUCCESSFULLY");
        console.log("To:", to);
        console.log("Message ID:", info.messageId);
        console.log("==================================");

        return info;

    } catch (error) {

        console.error("==================================");
        console.error("EMAIL SENDING FAILED");
        console.error(error.message);
        console.error("==================================");

        throw new Error("Unable to send email.");
    }
};

export default sendEmail;