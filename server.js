const path = require("path");
require("dotenv").config();

const express = require("express");
const app = express();

app.use(express.static(path.join(__dirname, "Public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Public", "index.html"));
});

  //AI 
  const aiRoutes = require("./AIintegration/routes/aiRoutes");
  console.log("AI ROUTES LOADED");

app.use(express.json());
app.use("/api/ai", aiRoutes);

console.log("ENV CHECK:", process.env.SUPABASE_URL);

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const supabase = require("./config/supabase");
console.log("SUPABASE TYPE:", typeof supabase);
console.log("SUPABASE VALUE:", supabase);
console.log("SUPABASE OBJECT:", supabase);
console.log("FROM EXISTS:", typeof supabase?.from);

// ---------------- TEST DB ----------------
const testDB = async () => {
  const { data, error } = await supabase
    .from("userlogin")
    .select("id")
    .limit(1);

  console.log("ERROR:", error);
  console.log("DATA:", data);
};

testDB();
// ---------------- APP SETUP ----------------
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// ---------------- SECURITY ----------------
const SECRET = "Interlinked_super_secret_key_change_later";

// ---------------- STATE ----------------
const queues = {
  India: [],
  USA: [],
  UK: []
};

const queueCooldown = new Map();
const ipLimits = new Map();

// ---------------- HELPERS ----------------
function sanitize(msg) {
  return String(msg)
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

// ---------------- MATCHMAKING ----------------
function matchUsers(country) {

  const queue = queues[country];

  console.log(
    "MATCH CHECK:",
    country,
    queue ? queue.length : 0
  );

  if (!queue || queue.length < 2) return;

  const user1 = queue.shift();
  const user2 = queue.shift();

  const room = Math.random().toString(36).substring(2, 10);

  user1.join(room);
  user2.join(room);

  user1.room = room;
  user2.room = room;

  user1.emit("matched");
  user2.emit("matched");

  user1.emit("chat-message", "Connected to stranger!");
  user2.emit("chat-message", "Connected to stranger!");

  console.log("MATCHED ROOM:", room);
}
// ---------------- SOCKET ----------------
io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

//LOGIN

socket.on("login", async (data) => {
  try {
    const { id, country } = data;

    if (!id || !country) {
      socket.emit("chat-message", "Missing login information.");
      return;
    }

    const { data: existingUser, error: findError } = await supabase
      .from("userlogin")
      .select("*")
      .eq("email_or_phone", id)
      .maybeSingle();

    if (findError) {
      console.log("USER SEARCH ERROR:", findError);
      return;
    }

    let user = existingUser;

    if (!user) {

      const nodeId =
        "NODE-" +
        Math.floor(100000 + Math.random() * 900000);

      const { data: newUser, error: insertError } = await supabase
        .from("userlogin")
        .insert([
          {
            node_id: nodeId,
            email_or_phone: id,
            country: country
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.log("USER INSERT ERROR:", insertError);
        return;
      }

      user = newUser;
    }

    const token = jwt.sign(
      {
        id,
        country,
        nodeId: user.node_id
      },
      SECRET,
      {
        expiresIn: "7d"
      }
    );

    socket.user = {
      id,
      country,
      nodeId: user.node_id,
      token
    };

    socket.emit("login-success", {
      token,
      nodeId: user.node_id,
      country: user.country
    });

  } catch (err) {
    console.log("LOGIN ERROR:", err);
  }
});


// JOIN QUEUE
  socket.on("join-queue", () => {

  const token = socket.user?.token;
  const user = verifyToken(token);

  if (!user) {
    socket.emit("chat-message", "Invalid session.");
    return;
  }

  const now = Date.now();

  if (queueCooldown.has(socket.id)) {

    const last = queueCooldown.get(socket.id);

    if (now - last < 3000) {
      socket.emit("chat-message", "Please wait before rejoining.");
      return;
    }
  }

  queueCooldown.set(socket.id, now);

  socket.userData = user;

  queues[user.country].push(socket);

  console.log(
    "QUEUE JOINED:",
    user.country,
    queues[user.country].length
  );

  socket.emit(
    "queue-status",
    "Waiting for someone from " + user.country
  );

  matchUsers(user.country);
});
// CHAT
socket.on("chat-message", (msg) => {

  console.log(
    "MESSAGE RECEIVED:",
    msg,
    "ROOM:",
    socket.room
  );

  if (socket.room) {

    socket.to(socket.room).emit(
      "chat-message",
      sanitize(msg)
    );

    console.log("MESSAGE FORWARDED");
  }
});
  // TYPING
  socket.on("typing", () => {
    if (socket.room) {
      socket.to(socket.room).emit("stranger-typing");
    }
  });

  // NEXT
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


  // DISCONNECT
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

// ---------------- SERVER START (ONLY ONCE) ----------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
 
