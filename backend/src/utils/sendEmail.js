import nodemailer from "nodemailer";

const sendEmail = async (options) => {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
        service: process.env.SMTP_SERVICE || undefined,
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
        },
        tls: {
            // allow self-signed certs if present in some environments
            rejectUnauthorized: process.env.NODE_ENV === 'production' ? true : false,
        },
    });

    const fromAddress = process.env.SMTP_FROM_NAME
        ? `${process.env.SMTP_FROM_NAME} <${process.env.SMTP_MAIL}>`
        : process.env.SMTP_MAIL;

    const mailOptions = {
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.html,
    };

    try {
        // verify connection configuration
        await transporter.verify();
    } catch (err) {
        console.error('SMTP connection verification failed:', err.message || err);
        // still attempt to send and return error
    }

    try {
        const info = await transporter.sendMail(mailOptions);
        console.info('Email sent:', {
            to: options.to,
            messageId: info && info.messageId,
            accepted: info && info.accepted,
            rejected: info && info.rejected,
            response: info && info.response,
        });
        return info;
    } catch (err) {
        console.error('Error sending email:', err);
        throw err;
    }
};

export default sendEmail;