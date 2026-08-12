const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Central Socket.IO Server is running",
    });
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.emit("connected", {
        message: "Successfully connected to Socket.IO server",
        socket_id: socket.id,
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = 3001;

server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
});