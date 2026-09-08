import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
    const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://e-commerce-eosin-one-13.vercel.app",
        process.env.FRONTEND_URL,
    ].filter(Boolean);

    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin) return callback(null, true);
                if (
                    allowedOrigins.some(o => origin.startsWith(o)) ||
                    origin.endsWith(".vercel.app") ||
                    process.env.NODE_ENV === "production" ||
                    origin.includes("localhost")
                ) {
                    return callback(null, true);
                }
                return callback(null, true);
            },
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("⚡ User Connected:", socket.id);

        socket.on("join", (userId) => {
            socket.join(userId);
        });

        socket.on("disconnect", () => {
            console.log("❌ User Disconnected");
        });
    });
};

export const getIO = () => io;