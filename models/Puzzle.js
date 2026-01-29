const mongoose = require("mongoose");

const PuzzleSchema = new mongoose.Schema({
  imageUrl: String,
  rows: { type: Number, default: 2 },
  cols: { type: Number, default: 2 }
});

module.exports = mongoose.model("Puzzle", PuzzleSchema);