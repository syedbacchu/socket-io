const { io } = require("socket.io-client");

const socket = io("http://localhost:3001");

socket.on("connect", () => {
    console.log("Connected to Socket.IO:", socket.id);
});

socket.on("connected", (data) => {
    console.log("Server says:", data);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});