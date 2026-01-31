import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db/index.js";
import { orders, drivers } from "./db/schema.js";
import { eq, desc, sql } from "drizzle-orm";

const app = express();

// CORS configuration
const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://haulkind-web.vercel.app";
const allowedOrigins = CORS_ORIGIN.split(",").map(o => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const DEBUG_TOKEN = process.env.DEBUG_TOKEN || "debug-token-change-in-production";

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

// Mock driver applications database
const driverApplications: any[] = [];
let applicationIdCounter = 1;

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

// Middleware to verify DEBUG_TOKEN
const authenticateDebugToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token || token !== DEBUG_TOKEN) {
    return res.status(403).json({ error: "Invalid debug token" });
  }

  next();
};

// =====================================================
// CUSTOMER AUTH ROUTES (for mobile app)
// =====================================================

// POST /customer/auth/signup
app.post('/customer/auth/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }
    
    // Check if email already exists using raw SQL
    const existingUsers = await db.execute(sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`);
    
    if (existingUsers.rows && existingUsers.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();
    
    // Insert user using raw SQL
    const insertResult = await db.execute(sql`
      INSERT INTO users (email, password_hash, role, full_name, phone, created_at, updated_at)
      VALUES (${email}, ${hashedPassword}, 'user', ${name}, ${phone || null}, ${now}, ${now})
      RETURNING id
    `);
    
    const userId = (insertResult.rows[0] as any).id;
    
    // Create customer record
    await db.execute(sql`
      INSERT INTO customers (user_id, created_at, updated_at)
      VALUES (${userId}, ${now}, ${now})
    `);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email, role: 'user', name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      customer: { id: userId, name, email }
    });
  } catch (error: any) {
    console.error('[CUSTOMER_SIGNUP] Error:', error);
    res.status(500).json({ error: 'Failed to create account', details: error.message });
  }
});

// POST /customer/auth/login
app.post('/customer/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email using raw SQL
    const userResult = await db.execute(sql`
      SELECT id, email, password_hash, full_name as name, role 
      FROM users 
      WHERE email = ${email} 
      LIMIT 1
    `);
    
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0] as any;
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      customer: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error: any) {
    console.error('[CUSTOMER_LOGIN] Error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// GET /customer/auth/me - Get current customer profile
app.get('/customer/auth/me', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    const userResult = await db.execute(sql`
      SELECT id, email, full_name as name, phone, role, created_at
      FROM users 
      WHERE id = ${userId} 
      LIMIT 1
    `);
    
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0] as any;
    
    res.json({
      success: true,
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.created_at
      }
    });
  } catch (error: any) {
    console.error('[CUSTOMER_ME] Error:', error);
    res.status(500).json({ error: 'Failed to get profile', details: error.message });
  }
});

// =====================================================
// END CUSTOMER AUTH ROUTES
// =====================================================

// Health check endpoint with version info and DB connection test
app.get("/health", async (req, res) => {
  try {
    // Test DB connection
    await db.select().from(orders).limit(1);

    res.json({
      ok: true,
      database: "connected",
      commit: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
      env: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || "unknown",
      timestamp: new Date().toISOString(),
      service: "haulkind-api"
    });
  } catch (error: any) {
    console.error('[HEALTH] Database connection failed:', error.message);
    res.status(500).json({
      ok: false,
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
      service: "haulkind-api"
    });
  }
});

// Debug endpoint to list last 20 orders (protected by DEBUG_TOKEN)
app.get("/debug/orders", authenticateDebugToken, async (req, res) => {
  try {
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(20);

    res.json({
      count: allOrders.length,
      orders: allOrders,
    });
  } catch (error: any) {
    console.error('[DEBUG_ORDERS] Error:', error.message);
    res.status(500).json({ error: "Failed to fetch orders", details: error.message });
  }
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

  res.json({
    admin: true,
    message: "Admin access granted",
  });
});

// Service areas endpoint
app.get("/service-areas", (req, res) => {
  res.json({
    areas: serviceAreas,
  });
});

// Check service availability by zip code
app.get("/service-areas/check/:zipCode", (req, res) => {
  const { zipCode } = req.params;
  
  const area = serviceAreas.find(a => a.zipCodes.includes(zipCode));
  
  if (area) {
    res.json({
      available: true,
      area: {
        id: area.id,
        name: area.name,
        state: area.state,
      },
    });
  } else {
    res.json({
      available: false,
      message: "Service not available in this area yet",
    });
  }
});

// Driver application endpoint
app.post("/driver-application", async (req, res) => {
  const { name, email, phone, city, state, vehicleType, experience } = req.body;

  if (!name || !email || !phone || !city || !state) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const application = {
    id: applicationIdCounter++,
    name,
    email,
    phone,
    city,
    state,
    vehicleType: vehicleType || "truck",
    experience: experience || "0-1 years",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  driverApplications.push(application);

  res.json({
    success: true,
    application,
  });
});

// Get all driver applications (admin only)
app.get("/driver-applications", authenticateToken, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  res.json({
    applications: driverApplications,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
