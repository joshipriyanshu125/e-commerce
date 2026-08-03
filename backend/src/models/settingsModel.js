import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
    {
        storeInfo: {
            name: { type: String, default: "Atelier Premium Store" },
            logo: { type: String, default: "" },
            address: { type: String, default: "123 Fashion Ave, Suite 500, New York, NY 10001" },
            phone: { type: String, default: "+1 (555) 234-5678" },
            email: { type: String, default: "support@atelier.com" },
        },
        payment: {
            stripeEnabled: { type: Boolean, default: true },
            stripeKey: { type: String, default: "pk_test_sample_key" },
            stripeSecret: { type: String, default: "sk_test_sample_secret" },
            razorpayEnabled: { type: Boolean, default: false },
            razorpayKeyId: { type: String, default: "" },
            razorpaySecret: { type: String, default: "" },
            paypalEnabled: { type: Boolean, default: true },
            paypalClientId: { type: String, default: "client_id_sample" },
            paypalSecret: { type: String, default: "secret_sample" },
        },
        shipping: {
            flatRate: { type: Number, default: 15 },
            freeShippingEnabled: { type: Boolean, default: true },
            minFreeShippingAmount: { type: Number, default: 150 },
            expressEnabled: { type: Boolean, default: true },
            expressRate: { type: Number, default: 35 },
        },
        tax: {
            taxType: { type: String, enum: ["GST", "VAT", "SalesTax"], default: "GST" },
            taxRate: { type: Number, default: 18 },
            taxId: { type: String, default: "29ABCDE1234F1Z5" },
        },
        email: {
            smtpHost: { type: String, default: "smtp.gmail.com" },
            smtpPort: { type: Number, default: 587 },
            smtpMail: { type: String, default: "joshipriyanshu125@gmail.com" },
            smtpPassword: { type: String, default: "••••••••••••" },
            sendOrderEmails: { type: Boolean, default: true },
            sendInvoiceEmails: { type: Boolean, default: true },
        },
        security: {
            enable2FA: { type: Boolean, default: false },
            sessionTimeout: { type: Number, default: 60 },
        },
    },
    { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
