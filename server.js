console.log("SERVER FILE IS RUNNING");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ ROOT ROUTE (THIS FIXES YOUR ISSUE)
app.get("/", (req, res) => {
  res.send("API is working 🚀");
});

// ✅ MongoDB
mongoose.connect("mongodb://admin:admin123@ac-moakdly-shard-00-00.fy8lnc0.mongodb.net:27017,ac-moakdly-shard-00-01.fy8lnc0.mongodb.net:27017,ac-moakdly-shard-00-02.fy8lnc0.mongodb.net:27017/taskdb?ssl=true&replicaSet=atlas-tqzjmc-shard-0&authSource=admin&retryWrites=true&w=majority")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Models
const User = mongoose.model("User", {
  name: String,
  email: String,
  password: String,
  role: String,
});

const Task = mongoose.model("Task", {
  title: String,
  status: String,
});

// Middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);
  const decoded = jwt.verify(token, "secret");
  req.user = decoded;
  next();
};

// Routes
app.post("/signup", async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hash,
      role: req.body.role,
    });

    res.json(user);
  } catch (err) {
    console.log("Signup Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, "secret");
    res.json({ token });
  } catch (err) {
    console.log("Login Error:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post("/tasks", auth, async (req, res) => {
  const task = await Task.create(req.body);
  res.json(task);
});

app.get("/tasks", auth, async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

// Start server
app.listen(5000, () => console.log("Server running"));