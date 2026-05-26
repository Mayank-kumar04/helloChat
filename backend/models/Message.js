const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true }, // Indexed for fast queries
  senderId: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
