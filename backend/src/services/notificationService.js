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
}) => {
    try {
        // Save notification to database
        const notification = await Notification.create({
            user: userId,
            title,
            message,
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

export {
    sendNotification,
};