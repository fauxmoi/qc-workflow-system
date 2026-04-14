require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── MongoDB connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => { console.error("MongoDB connection error:", err); process.exit(1); });

// ── Schemas ───────────────────────────────────────────────────────────────────
const instructionSchema = new mongoose.Schema(
  {
    barrelId:    { type: String, required: true },
    testResult:  { type: String, enum: ["Pass", "Fail"], required: true },
    instruction: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed"],
      default: "pending",
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },   // bcrypt hash
  role:     { type: String, enum: ["manager", "qc", "worker"], required: true },
});

const Instruction = mongoose.model("Instruction", instructionSchema);
const User        = mongoose.model("User", userSchema);

// ── Seed default users (runs once if collection is empty) ─────────────────────
async function seedUsers() {
  const count = await User.countDocuments();
  if (count > 0) return;

  const defaults = [
    { username: "manager", password: process.env.MANAGER_PASSWORD || "ChangeMe!Manager1", role: "manager" },
    { username: "qc",      password: process.env.QC_PASSWORD      || "ChangeMe!QC1",      role: "qc"      },
    { username: "worker",  password: process.env.WORKER_PASSWORD  || "ChangeMe!Worker1",  role: "worker"  },
  ];

  for (const u of defaults) {
    u.password = await bcrypt.hash(u.password, 12);
  }

  await User.insertMany(defaults);
  console.log("Default users seeded. Set MANAGER_PASSWORD / QC_PASSWORD / WORKER_PASSWORD in .env before first run.");
}

mongoose.connection.once("open", seedUsers);

// ── Auth API ──────────────────────────────────────────────────────────────────
// POST /api/login  { username, password }  → { role }
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing credentials." });
  }

  const user = await User.findOne({ username: username.toLowerCase().trim() });
  if (!user) {
    // constant-time rejection to avoid user enumeration
    await bcrypt.compare(password, "$2b$12$invalidhashpadding000000000000000000000000000000000000000");
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid username or password." });

  res.json({ role: user.role });
});

// ── Instructions API ──────────────────────────────────────────────────────────
// GET  /api/instructions?status=pending|approved|...
app.get("/api/instructions", async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    const rows = await Instruction.find(filter).sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch instructions." });
  }
});

// POST /api/instructions
app.post("/api/instructions", async (req, res) => {
  try {
    const { barrelId, testResult, instruction } = req.body;
    if (!barrelId || !testResult || !instruction) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const doc = await Instruction.create({ barrelId, testResult, instruction });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: "Failed to create instruction." });
  }
});

// PATCH /api/instructions/:id  { status }
app.patch("/api/instructions/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "approved", "rejected", "completed"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }
    const doc = await Instruction.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: "Instruction not found." });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: "Failed to update instruction." });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));