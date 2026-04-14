const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const DB_FILE = path.join(__dirname, "db.json");

app.use(express.json());
app.use(express.static(__dirname));

function readDB() {
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, "[]");
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.post("/api/instructions", (req, res) => {
  const { barrelId, testResult, instruction } = req.body;
  if (!barrelId || !testResult || !instruction)
    return res.status(400).json({ error: "Missing fields" });

  const db = readDB();
  const record = {
    id: Date.now().toString(),
    barrelId,
    testResult,
    instruction,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  db.push(record);
  writeDB(db);
  res.status(201).json(record);
});

app.get("/api/instructions", (req, res) => {
  const db = readDB();
  const { status } = req.query;
  res.json(status ? db.filter((r) => r.status === status) : db);
});

app.patch("/api/instructions/:id", (req, res) => {
  const { status } = req.body;
  const allowed = ["approved", "rejected", "completed"];
  if (!allowed.includes(status))
    return res.status(400).json({ error: "Invalid status" });

  const db = readDB();
  const record = db.find((r) => r.id === req.params.id);
  if (!record) return res.status(404).json({ error: "Not found" });

  record.status = status;
  record.updatedAt = new Date().toISOString();
  writeDB(db);
  res.json(record);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running → http://localhost:${PORT}`));
