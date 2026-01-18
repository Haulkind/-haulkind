import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();

// CORS configuration
const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://haulkind-web.vercel.app";
app.use(
  cors({
    origin: CORS_ORIGIN.split(","),
    credentials: true,
  })
);

app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Mock user database (in production, use real database)
const users = [
  {
    id: "1",
    email: "admin@haulkind.com",
    password: "$2a$10$YourHashedPasswordHere", // bcrypt hash of "admin123"
    name: "Admin User",
    role: "admin",
  },
];

// Middleware to verify JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Auth endpoints
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  // Find user
  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Verify password (in production, use bcrypt.compare)
  // For now, accept any password for testing
  const isValidPassword = password === "admin123" || (await bcrypt.compare(password, user.password));
  
  if (!isValidPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
});

app.get("/auth/me", authenticateToken, (req: any, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
});

// Admin endpoint
app.get("/admin/ping", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  res.json({ admin: true, message: "Admin access granted" });
});

// Start server
const PORT = parseInt(process.env.PORT || "3000");
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Haulkind API running on port ${PORT}`);
  console.log(`📡 Health check: /health`);
  console.log(`🔐 CORS origin: ${CORS_ORIGIN}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
