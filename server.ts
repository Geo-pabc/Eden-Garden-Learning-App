import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

const db = new Database("eden_garden.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT, -- 'admin', 'teacher', 'student'
    name TEXT,
    class_name TEXT -- For students and teachers (if assigned to one)
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    type TEXT, -- 'pdf', 'video', 'note'
    url TEXT,
    class_name TEXT,
    subject TEXT,
    uploaded_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS homework (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    file_url TEXT,
    class_name TEXT,
    subject TEXT,
    teacher_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  db.prepare("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)").run(
    "admin",
    "admin123",
    "admin",
    "System Administrator"
  );
}

const app = express();

// API Logging
app.all("/api/*", (req, res, next) => {
  console.log(`[API LOG] ${req.method} ${req.url}`);
  next();
});

app.use("/uploads", express.static(uploadsDir));

// File Upload Endpoint
app.get("/api/file-upload", (req, res) => {
  res.json({ message: "Upload endpoint is reachable" });
});

app.post("/api/file-upload", (req, res) => {
  console.log("Processing upload request...");
  upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(500).json({ error: err.message });
    }
    if (!req.file) {
      console.error("No file in request. Body:", req.body);
      return res.status(400).json({ error: "No file uploaded" });
    }
    console.log("File uploaded successfully:", req.file.filename);
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
});

app.use(express.json());

// Auth Endpoints
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT id, username, role, name, class_name FROM users WHERE username = ? AND password = ?").get(username, password);
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Admin: User Management
app.get("/api/users", (req, res) => {
  const users = db.prepare("SELECT id, username, password, role, name, class_name FROM users").all();
  res.json(users);
});

app.post("/api/users", (req, res) => {
  const { username, password, role, name, class_name } = req.body;
  try {
    const result = db.prepare("INSERT INTO users (username, password, role, name, class_name) VALUES (?, ?, ?, ?, ?)").run(username, password, role, name, class_name);
    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: "Username already exists" });
  }
});

app.delete("/api/users/:id", (req, res) => {
  db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.put("/api/users/:id", (req, res) => {
  const { username, password, role, name, class_name } = req.body;
  try {
    db.prepare("UPDATE users SET username = ?, password = ?, role = ?, name = ?, class_name = ? WHERE id = ?")
      .run(username, password, role, name, class_name, req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Username already exists or invalid data" });
  }
});

// Materials
app.get("/api/materials", (req, res) => {
  const { class_name, subject } = req.query;
  let query = "SELECT * FROM materials";
  const params = [];
  if (class_name && subject) {
    query += " WHERE class_name = ? AND subject = ?";
    params.push(class_name, subject);
  } else if (class_name) {
    query += " WHERE class_name = ?";
    params.push(class_name);
  }
  const materials = db.prepare(query).all(...params);
  res.json(materials);
});

app.post("/api/materials", (req, res) => {
  const { title, type, url, class_name, subject, uploaded_by } = req.body;
  const result = db.prepare("INSERT INTO materials (title, type, url, class_name, subject, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)").run(title, type, url, class_name, subject, uploaded_by);
  res.json({ id: result.lastInsertRowid });
});

app.delete("/api/materials/:id", (req, res) => {
  db.prepare("DELETE FROM materials WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.put("/api/materials/:id", (req, res) => {
  const { title, type, url, class_name, subject } = req.body;
  try {
    db.prepare("UPDATE materials SET title = ?, type = ?, url = ?, class_name = ?, subject = ? WHERE id = ?")
      .run(title, type, url, class_name, subject, req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Failed to update material" });
  }
});

// Homework
app.get("/api/homework", (req, res) => {
  const { class_name, subject } = req.query;
  let query = "SELECT * FROM homework";
  const params = [];
  if (class_name && subject) {
    query += " WHERE class_name = ? AND subject = ?";
    params.push(class_name, subject);
  } else if (class_name) {
    query += " WHERE class_name = ?";
    params.push(class_name);
  }
  const homework = db.prepare(query).all(...params);
  res.json(homework);
});

app.post("/api/homework", (req, res) => {
  const { title, description, file_url, class_name, subject, teacher_id } = req.body;
  const result = db.prepare("INSERT INTO homework (title, description, file_url, class_name, subject, teacher_id) VALUES (?, ?, ?, ?, ?, ?)").run(title, description, file_url, class_name, subject, teacher_id);
  res.json({ id: result.lastInsertRowid });
});

app.delete("/api/homework/:id", (req, res) => {
  db.prepare("DELETE FROM homework WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.put("/api/homework/:id", (req, res) => {
  const { title, description, file_url, class_name, subject } = req.body;
  try {
    db.prepare("UPDATE homework SET title = ?, description = ?, file_url = ?, class_name = ?, subject = ? WHERE id = ?")
      .run(title, description, file_url, class_name, subject, req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: "Failed to update homework" });
  }
});

// Notices
app.get("/api/notices", (req, res) => {
  const notices = db.prepare("SELECT * FROM notices ORDER BY created_at DESC").all();
  res.json(notices);
});

app.post("/api/notices", (req, res) => {
  const { content } = req.body;
  const result = db.prepare("INSERT INTO notices (content) VALUES (?)").run(content);
  res.json({ id: result.lastInsertRowid });
});

app.delete("/api/notices/:id", (req, res) => {
  db.prepare("DELETE FROM notices WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

// Chat
app.get("/api/messages", (req, res) => {
  const { user1, user2 } = req.query;
  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) 
    OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `).all(user1, user2, user2, user1);
  res.json(messages);
});

app.post("/api/messages", (req, res) => {
  const { sender_id, receiver_id, content } = req.body;
  const result = db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)").run(sender_id, receiver_id, content);
  res.json({ id: result.lastInsertRowid });
});

// Teachers list for students to chat
app.get("/api/teachers", (req, res) => {
  const teachers = db.prepare("SELECT id, name, class_name FROM users WHERE role = 'teacher'").all();
  res.json(teachers);
});

// Students list for teachers to chat
app.get("/api/students", (req, res) => {
  const { class_name, teacher_id } = req.query;
  
  // Get students in the class OR students who have sent/received messages with this teacher
  const students = db.prepare(`
    SELECT DISTINCT u.id, u.name, u.class_name 
    FROM users u
    LEFT JOIN messages m ON (m.sender_id = u.id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.id)
    WHERE u.role = 'student' AND (u.class_name = ? OR m.id IS NOT NULL)
  `).all(teacher_id, teacher_id, class_name);
  
  res.json(students);
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
