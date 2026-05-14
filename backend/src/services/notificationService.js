import Notification from "../models/notificationModel.js";

import { getIO } from "../config/socket.js";

export const sendNotification = async ({
    userId,
    title,
    message,
}) => {
    const notification = await Notification.create({
        user: userId,
        title,
        message,
    });

    const io = getIO();

    io.to(userId.toString()).emit(
        "newNotification",
        notification
    );

    return notification;
};