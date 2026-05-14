import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
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