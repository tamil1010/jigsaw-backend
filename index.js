
//server
require('dotenv').config();
const mongoose = require("mongoose");

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🚀 Connected to MongoDB Atlas (Cloud)"))
  .catch(err => console.error("❌ MongoDB Atlas connection error:", err));
/* ===============================
   GLOBAL SESSION STATE
================================ */
let session = {
  started: false,
  startTime: null,
  endTime: null,
};

/* ===============================
   PLAYER DATA (IN-MEMORY)
   { name, startTime, endTime, score }
================================ */
let players = [];

/* ===============================
   GET SESSION STATUS
================================ */
app.get("/session", (req, res) => {
  res.json({ session });
});

/* ===============================
   START SESSION (ADMIN)
================================ */
app.post("/session/start", (req, res) => {
  session.started = true;
  session.startTime = new Date();
  session.endTime = null;

  players = []; // reset players for new session

  res.json({ message: "Session started", session });
});

/* ===============================
   END SESSION (ADMIN)
================================ */
app.post("/session/end", (req, res) => {
  session.started = false;
  session.endTime = new Date();

  res.json({ message: "Session ended", session });
});

/* ===============================
   PLAYER STARTS GAME
   (PREVENT DUPLICATES)
================================ */
app.post("/player/start", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Player name required" });
  }

  const existingPlayer = players.find(p => p.name === name);

  // 🔥 DO NOT CREATE DUPLICATE
  if (existingPlayer) {
    return res.json({ message: "Player already registered" });
  }

  players.push({
    name,
    startTime: new Date(),
    endTime: null,
    score: 0,
  });

  res.json({ message: "Player started" });
});

/* ===============================
   PLAYER FINISHES GAME
   (SET END TIME ONCE)
================================ */
app.post("/player/end", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Player name required" });
  }

  const player = players.find(p => p.name === name);
  if (!player) {
    return res.status(404).json({ error: "Player not found" });
  }

  // 🔥 PREVENT DOUBLE END
  if (player.endTime) {
    return res.json({ message: "Player already finished", player });
  }

  player.endTime = new Date();

  const timeTakenSeconds =
    (player.endTime - player.startTime) / 1000;

  // SCORE: faster = higher (max 100)
  player.score = Math.max(0, Math.round(100 - timeTakenSeconds));

  res.json({ message: "Player finished", player });
});

/* ===============================
   ADMIN: GET PLAYERS WITH RANKING
   (RANK BY SCORE DESC)
================================ */
app.get("/admin/players", (req, res) => {
  const rankedPlayers = [...players]
    .sort((a, b) => b.score - a.score)
    .map((p, index) => ({
      ...p,
      rank: p.endTime ? index + 1 : "-", // unfinished → no rank
    }));

  res.json(rankedPlayers);
});

/* ===============================
   START SERVER
================================ */
app.get("/", (req, res) => {
  res.send("Jigsaw Puzzle API is running...");
});

app.listen(5000, () => {
  console.log("✅ Server running on http://localhost:5000");
});