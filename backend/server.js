require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const Message = require("./models/Message");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/chatapp")
  .then(() => console.log("📁 Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] },
});

// REST API: Fetch chat history with pagination
app.get("/api/messages/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // Get messages sorted by newest first, then reverse them for the chat UI
    const messages = await Message.find({ roomId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.json(messages.reverse());
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

const generateId = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// Global state to track who is currently online
const onlineUsers = new Set();

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId) {
    socket.disconnect();
    return;
  }

  // 1. Join personal message room and add to global online set
  socket.join(userId);
  onlineUsers.add(userId);
  console.log(`🟢 User online: ${userId}`);

  // 2. ONLY broadcast to people who have specifically subscribed to this user
  socket
    .to(`presence_${userId}`)
    .emit("presence_update", { userId, status: "online" });

  // 3. Handle Presence Subscriptions from the Frontend
  socket.on("subscribe_presence", (targetIds, callback) => {
    const currentlyOnline = [];

    targetIds.forEach((id) => {
      // Join the presence room for each contact
      socket.join(`presence_${id}`);
      // Check if they are already online right now
      if (onlineUsers.has(id)) {
        currentlyOnline.push(id);
      }
    });

    // Send back the list of contacts who are currently online
    if (callback) callback(currentlyOnline);
  });

  // Handle incoming messages
  socket.on("send_private_message", async (data) => {
    const { roomId, targetId, senderId, text } = data;
    try {
      const newMessage = new Message({ roomId, senderId, text });
      await newMessage.save();
    } catch (err) {
      console.error("Failed to save message", err);
    }
    socket
      .to(targetId)
      .emit("receive_message", { senderId, text, timestamp: new Date() });
  });

  // 4. Handle Disconnects privately
  socket.on("disconnect", () => {
    console.log(`🔴 User offline: ${userId}`);
    onlineUsers.delete(userId);
    // Tell ONLY subscribers they went offline
    socket
      .to(`presence_${userId}`)
      .emit("presence_update", { userId, status: "offline" });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Backend Server running on http://localhost:${PORT}`),
);
