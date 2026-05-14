import nodemailer from "nodemailer";

const sendEmail = async (options) => {

    const transporter = nodemailer.createTransport({

        service: "gmail",

        host: process.env.SMTP_HOST,

        port: Number(process.env.SMTP_PORT),

        secure: false,

        auth: {

            user: process.env.SMTP_MAIL,

            pass: process.env.SMTP_PASSWORD,

        },

    });


    const mailOptions = {

        from: process.env.SMTP_MAIL,

        to: options.to,

        subject: options.subject,

        html: options.html,

    };


    await transporter.sendMail(mailOptions);

};

export default sendEmail;