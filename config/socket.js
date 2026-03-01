const { Server } = require("socket.io");

let io;

module.exports = {
    init: (server) => {
        io = new Server(server, {
            cors: {
                origin: "http://localhost:5173", // URL of the frontend
                methods: ["GET", "POST"]
            }
        });

        io.on("connection", (socket) => {
            console.log(`Client Connected: ${socket.id}`);

            // Users can join a room using their Order ID to listen for exclusive updates
            socket.on("joinOrderRoom", (orderId) => {
                socket.join(orderId);
                console.log(`Socket ${socket.id} joined room ${orderId}`);
            });

            socket.on("disconnect", () => {
                console.log(`Client Disconnected: ${socket.id}`);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};
