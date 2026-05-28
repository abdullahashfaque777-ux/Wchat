const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// ---------------- SECURITY ----------------
const SECRET = "wchat_super_secret_key_change_later";

// ---------------- STATE ----------------
let queues = {
    India: [],
    USA: [],
    UK: []
};

const queueCooldown = new Map();
const ipLimits = new Map();

// ---------------- HELPERS ----------------
function createToken(user) {
    return jwt.sign(user, SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET);
    } catch {
        return null;
    }
}

function sanitize(msg) {
    return String(msg)
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// ---------------- MATCHMAKING ----------------
function matchUsers(country) {

    const queue = queues[country];

    if (queue.length < 2) return;

    const user1 = queue.shift();
    const user2 = queue.shift();

    const room = Math.random().toString(36).substring(2, 10);

    user1.join(room);
    user2.join(room);

    user1.room = room;
    user2.room = room;

    user1.emit("chat-message", "Connected to stranger!");
    user2.emit("chat-message", "Connected to stranger!");
}

// ---------------- SOCKET CONNECTION ----------------
io.on("connection", (socket) => {

    console.log("User connected:", socket.id);

    // ---------------- LOGIN ----------------
    socket.on("login", (data) => {

        const { id, country } = data;

        if (!id || !country) {
            socket.emit("chat-message", "Invalid login data");
            return;
        }

        const token = createToken({ id, country });

        socket.user = { id, country, token };

        socket.emit("login-success", token);
    });

    // ---------------- JOIN QUEUE ----------------
    socket.on("join-queue", () => {

        const token = socket.user?.token;
        const user = verifyToken(token);

        if (!user) {
            socket.emit("chat-message", "Invalid session. Reload required.");
            return;
        }

        const now = Date.now();

        if (queueCooldown.has(socket.id)) {
            const last = queueCooldown.get(socket.id);

            if (now - last < 3000) {
                socket.emit("chat-message", "Please wait before rejoining queue.");
                return;
            }
        }

        queueCooldown.set(socket.id, now);

        socket.userData = user;

        queues[user.country].push(socket);

        matchUsers(user.country);
    });

    // ---------------- CHAT MESSAGE ----------------
    socket.on("chat-message", (msg) => {

        const now = Date.now();

        // IP rate limit
        const ip =
            socket.handshake.headers["x-forwarded-for"] ||
            socket.handshake.address;

        if (!ipLimits.has(ip)) {
            ipLimits.set(ip, []);
        }

        const history = ipLimits.get(ip);
        const recent = history.filter(t => now - t < 5000);

        if (recent.length >= 5) {
            socket.emit("chat-message", "You are sending messages too fast.");
            return;
        }

        recent.push(now);
        ipLimits.set(ip, recent);

        if (socket.room) {
            socket.to(socket.room).emit("chat-message", sanitize(msg));
        }
    });

    // ---------------- TYPING ----------------
    socket.on("typing", () => {
        if (socket.room) {
            socket.to(socket.room).emit("stranger-typing");
        }
    });

    // ---------------- NEXT STRANGER ----------------
    socket.on("next-stranger", () => {

        const country = socket.userData?.country;

        if (socket.room) {
            socket.to(socket.room).emit("chat-message", "Stranger left the chat.");
            socket.leave(socket.room);
        }

        socket.room = null;

        if (country) {
            queues[country] = queues[country].filter(s => s !== socket);
            queues[country].push(socket);

            matchUsers(country);
        }
    });

    // ---------------- DISCONNECT ----------------
    socket.on("disconnect", () => {

        const country = socket.userData?.country;

        if (country) {
            queues[country] = queues[country].filter(s => s !== socket);
        }

        if (socket.room) {
            socket.to(socket.room).emit("chat-message", "Stranger disconnected.");
        }

        console.log("User disconnected:", socket.id);
    });

});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});