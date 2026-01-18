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

// Mock service areas database
const serviceAreas = [
  { id: 1, name: "Philadelphia Metro", state: "PA", zipCodes: ["19103", "19102", "19104", "19106", "19107"] },
  { id: 2, name: "Pittsburgh Metro", state: "PA", zipCodes: ["15201", "15213", "15232"] },
  { id: 3, name: "New York Metro", state: "NY", zipCodes: ["10001", "10002", "10003"] },
];

// Mock jobs database
const jobs: any[] = [];
let jobIdCounter = 1;

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

// ============================================
// SERVICE AREA ENDPOINTS
// ============================================

// Check if coordinates are in service area
app.get("/service-areas/lookup", (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Latitude and longitude required" });
  }

  // For Philadelphia coordinates (39.9526, -75.1652), return covered
  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);

  // Simple check: if coordinates are near Philadelphia, return Philadelphia Metro
  if (latitude >= 39.8 && latitude <= 40.1 && longitude >= -75.3 && longitude <= -75.0) {
    return res.json({
      covered: true,
      serviceArea: serviceAreas[0], // Philadelphia Metro
    });
  }

  // For demo purposes, accept all coordinates
  res.json({
    covered: true,
    serviceArea: serviceAreas[0],
  });
});

// ============================================
// QUOTE ENDPOINTS
// ============================================

// Calculate quote
app.post("/quotes", (req, res) => {
  const {
    serviceType,
    serviceAreaId,
    volumeTier,
    addons = [],
    helperCount = 2,
    estimatedHours = 2,
  } = req.body;

  let servicePrice = 0;
  let addonPrice = 0;
  const distancePrice = 0; // Fixed for demo
  const disposalIncluded = 0;

  if (serviceType === "HAUL_AWAY") {
    // Volume tier pricing
    const volumePricing: any = {
      "1-5": 150,
      "6-10": 250,
      "11-15": 350,
      "16-20": 450,
      "20+": 550,
    };
    servicePrice = volumePricing[volumeTier] || 150;

    // Addon pricing
    const addonPricing: any = {
      "heavy-items": 50,
      "stairs": 30,
      "disassembly": 40,
      "extra-helper": 75,
    };
    addonPrice = addons.reduce((sum: number, addon: string) => sum + (addonPricing[addon] || 0), 0);
  } else if (serviceType === "LABOR_ONLY") {
    // Labor only: $50/hour per helper
    servicePrice = helperCount * estimatedHours * 50;
  }

  const total = servicePrice + addonPrice + distancePrice + disposalIncluded;

  const breakdown = [
    { label: "Service Fee", amount: servicePrice },
  ];

  if (addonPrice > 0) {
    breakdown.push({ label: "Add-ons", amount: addonPrice });
  }

  res.json({
    servicePrice,
    addonPrice,
    distancePrice,
    disposalIncluded,
    total,
    breakdown,
  });
});

// ============================================
// JOB ENDPOINTS
// ============================================

// Create job
app.post("/jobs", (req, res) => {
  const {
    serviceType,
    serviceAreaId,
    pickupLat,
    pickupLng,
    pickupAddress,
    scheduledFor,
    volumeTier,
    addons = [],
    helperCount = 2,
    estimatedHours = 2,
    customerNotes = "",
    photoUrls = [],
  } = req.body;

  // Calculate total (same logic as quotes)
  let total = 0;
  if (serviceType === "HAUL_AWAY") {
    const volumePricing: any = {
      "1-5": 150,
      "6-10": 250,
      "11-15": 350,
      "16-20": 450,
      "20+": 550,
    };
    total = volumePricing[volumeTier] || 150;

    const addonPricing: any = {
      "heavy-items": 50,
      "stairs": 30,
      "disassembly": 40,
      "extra-helper": 75,
    };
    total += addons.reduce((sum: number, addon: string) => sum + (addonPricing[addon] || 0), 0);
  } else if (serviceType === "LABOR_ONLY") {
    total = helperCount * estimatedHours * 50;
  }

  const job = {
    id: jobIdCounter++,
    serviceType,
    serviceAreaId,
    pickupLat,
    pickupLng,
    pickupAddress,
    scheduledFor,
    volumeTier,
    addons,
    helperCount,
    estimatedHours,
    customerNotes,
    photoUrls,
    status: "PENDING_PAYMENT",
    total,
    createdAt: new Date().toISOString(),
  };

  jobs.push(job);

  res.json({
    id: job.id,
    status: job.status,
    total: job.total,
  });
});

// Pay for job
app.post("/jobs/:id/pay", (req, res) => {
  const jobId = parseInt(req.params.id);
  const { paymentMethodId } = req.body;

  const job = jobs.find((j) => j.id === jobId);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  if (job.status !== "PENDING_PAYMENT") {
    return res.status(400).json({ error: "Job already paid or cancelled" });
  }

  // Simulate payment processing
  job.status = "PENDING_DISPATCH";
  job.paymentMethodId = paymentMethodId;
  job.paidAt = new Date().toISOString();

  res.json({ success: true });
});

// Get job status
app.get("/jobs/:id", (req, res) => {
  const jobId = parseInt(req.params.id);
  const job = jobs.find((j) => j.id === jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  res.json({
    status: job.status,
    driver: job.driver || null,
  });
});

// Start server
const PORT = parseInt(process.env.PORT || "3000");
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Haulkind API running on port ${PORT}`);
  console.log(`📡 Health check: /health`);
  console.log(`🔐 CORS origin: ${CORS_ORIGIN}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
