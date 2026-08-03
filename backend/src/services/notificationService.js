import Notification from "../models/notificationModel.js";
import { getIO } from "../config/socket.js";

/*
==================================================
SEND NOTIFICATION
==================================================
*/
const sendNotification = async ({
    userId,
    title,
    message,
    type = "general",
}) => {
    try {
        // Save notification to database
        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
        });

        // Emit notification through Socket.IO
        try {
            const io = getIO();

            if (io) {
                io.to(userId.toString()).emit(
                    "newNotification",
                    notification
                );
            }
        } catch (socketError) {
            console.error(
                "Socket Notification Error:",
                socketError.message
            );
        }

        return notification;
    } catch (error) {
        console.error(
            "Notification Service Error:",
            error.message
        );

        throw error;
    }
};

/*
==================================================
NOTIFY ALL ADMINS
==================================================
*/
const notifyAdmins = async ({ title, message, type = "general" }) => {
    try {
        const User = (await import("../models/userModel.js")).default;
        const admins = await User.find({ role: "admin" });
        for (const admin of admins) {
            await sendNotification({
                userId: admin._id,
                title,
                message,
                type,
            });
        }
        try {
            const io = getIO();
            if (io) {
                io.emit("adminNotification", { title, message, type, createdAt: new Date() });
            }
        } catch (socketErr) {
            console.error("Socket adminNotification Error:", socketErr.message);
        }
    } catch (error) {
        console.error(
            "Failed to notify admins:",
            error.message
        );
    }
};

export {
    sendNotification,
    notifyAdmins,
};