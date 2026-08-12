const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Central Socket.IO Server is running",
    });
});

/*
|--------------------------------------------------------------------------
| Socket.IO Connection
|--------------------------------------------------------------------------
*/

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    /*
    |--------------------------------------------------------------------------
    | Temporary user identification
    |--------------------------------------------------------------------------
    |
    | Authentication will be added in the next step.
    | For now, client can send user_id.
    |
    */

    socket.on("authenticate", (data) => {
        const userId = data?.user_id;

        if (!userId) {
            socket.emit("authentication-error", {
                message: "User ID is required.",
            });

            return;
        }

        const room = `user:${userId}`;

        socket.join(room);

        socket.data.userId = userId;

        console.log(
            `Socket ${socket.id} joined room ${room}`
        );

        socket.emit("authenticated", {
            success: true,
            user_id: userId,
            message: "Socket authenticated successfully.",
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Disconnect
    |--------------------------------------------------------------------------
    */

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

/*
|--------------------------------------------------------------------------
| Public Notification
|--------------------------------------------------------------------------
*/

app.post("/internal/notify/public", (req, res) => {
    const { title, message } = req.body;

    if (!title || !message) {
        return res.status(422).json({
            success: false,
            message: "Title and message are required.",
        });
    }

    const notification = {
        title,
        message,
    };

    io.emit("public-notification", notification);

    console.log("Public notification sent:", notification);

    return res.json({
        success: true,
        message: "Public notification sent successfully.",
    });
});

/*
|--------------------------------------------------------------------------
| Private Notification
|--------------------------------------------------------------------------
*/

app.post("/internal/notify/private", (req, res) => {
    const { user_id, title, message } = req.body;

    if (!user_id || !title || !message) {
        return res.status(422).json({
            success: false,
            message: "user_id, title and message are required.",
        });
    }

    const room = `user:${user_id}`;

    const notification = {
        user_id,
        title,
        message,
    };

    io.to(room).emit(
        "private-notification",
        notification
    );

    console.log(
        `Private notification sent to ${room}:`,
        notification
    );

    return res.json({
        success: true,
        message: "Private notification sent successfully.",
    });
});

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const PORT = 3001;

server.listen(PORT, () => {
    console.log(
        `Socket.IO server running on port ${PORT}`
    );
});