import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db/index.js";
import { orders, drivers, users as usersTable, customers } from "./db/schema.js";
import * as adminRoutes from "./admin-routes.js";
import { eq, desc, sql } from "drizzle-orm";

const app = express();

// CORS configuration
const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://haulkind-web.vercel.app";
const allowedOrigins = CORS_ORIGIN.split(",").map(o => o.trim());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const DEBUG_TOKEN = process.env.DEBUG_TOKEN || "debug-token-change-in-production";

// Extend Express Request type
interface AuthRequest extends Request {
  user?: { id: string | number; email: string; role: string; name?: string };
}

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
interface DriverApplication {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  vehicleType: string;
  experience: string;
  status: string;
  createdAt: string;
}
const driverApplications: DriverApplication[] = [];
let applicationIdCounter = 1;

// Middleware to verify JWT
const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err: Error | null, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

// Middleware to verify DEBUG_TOKEN
const authenticateDebugToken = (req: Request, res: Response, next: NextFunction) => {
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
app.post('/customer/auth/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    
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
    
    // Insert user using raw SQL - using columns that exist in the table (id, email, password, name)
    const insertResult = await db.execute(sql`
      INSERT INTO users (email, password, name)
      VALUES (${email}, ${hashedPassword}, ${name})
      RETURNING id
    `);
    
    const userId = (insertResult.rows[0] as { id: number }).id;
    
    // Create customer record - using columns that exist (id, user_id)
    await db.execute(sql`
      INSERT INTO customers (user_id)
      VALUES (${userId})
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
  } catch (error: unknown) {
    console.error('[CUSTOMER_SIGNUP] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to create account', details: errorMessage });
  }
});

// POST /customer/auth/login
app.post('/customer/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email using raw SQL - using columns that exist (id, email, password, name)
    const userResult = await db.execute(sql`
      SELECT id, email, password, name 
      FROM users 
      WHERE email = ${email} 
      LIMIT 1
    `);
    
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0] as { id: number; email: string; password: string; name: string };
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user', name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.json({
      success: true,
      token,
      customer: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error: unknown) {
    console.error('[CUSTOMER_LOGIN] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Login failed', details: errorMessage });
  }
});

// GET /customer/auth/me - Get current customer profile
app.get('/customer/auth/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Using columns that exist (id, email, password, name)
    const userResult = await db.execute(sql`
      SELECT id, email, name
      FROM users 
      WHERE id = ${userId} 
      LIMIT 1
    `);
    
    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0] as { id: number; email: string; name: string };
    
    res.json({
      success: true,
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: 'user'
      }
    });
  } catch (error: unknown) {
    console.error('[CUSTOMER_ME] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to get profile', details: errorMessage });
  }
});

// =====================================================
// END CUSTOMER AUTH ROUTES
// =====================================================

// Health check endpoint with version info and DB connection test
app.get("/health", async (req: Request, res: Response) => {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[HEALTH] Database connection failed:', errorMessage);
    res.status(500).json({
      ok: false,
      database: "disconnected",
      error: errorMessage,
      timestamp: new Date().toISOString(),
      service: "haulkind-api"
    });
  }
});

// Create admin user endpoint (protected by DEBUG_TOKEN)
app.post("/create-admin", authenticateDebugToken, async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' });
    }
    
    // Check if admin already exists
    const existingAdmin = await db.execute(sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`);
    
    if (existingAdmin.rows && existingAdmin.rows.length > 0) {
      return res.status(400).json({ error: 'Admin already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert admin user
    const insertResult = await db.execute(sql`
      INSERT INTO users (email, password_hash, full_name, role, phone)
      VALUES (${email}, ${hashedPassword}, ${name}, 'admin', '')
      RETURNING id
    `);
    
    const adminId = (insertResult.rows[0] as { id: number }).id;
    
    res.json({
      success: true,
      admin: { id: adminId, email, name, role: 'admin' }
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[CREATE_ADMIN] Error:', errorMessage);
    res.status(500).json({ error: 'Failed to create admin', details: errorMessage });
  }
});

// Migration endpoint (protected by DEBUG_TOKEN)
app.post("/migrate", authenticateDebugToken, async (req: Request, res: Response) => {
  try {
    const { runMigrations } = await import("./migrate.js");
    const result = await runMigrations();
    res.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[MIGRATE] Error:', errorMessage);
    res.status(500).json({ error: "Migration failed", details: errorMessage });
  }
});

// Debug endpoint to list last 20 orders (protected by DEBUG_TOKEN)
app.get("/debug/orders", authenticateDebugToken, async (req: Request, res: Response) => {
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DEBUG_ORDERS] Error:', errorMessage);
    res.status(500).json({ error: "Failed to fetch orders", details: errorMessage });
  }
});

// Auth endpoints
app.post("/auth/login", async (req: Request, res: Response) => {
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

app.get("/auth/me", authenticateToken, (req: AuthRequest, res: Response) => {
  const user = users.find((u) => u.id === req.user?.id?.toString());
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
app.get("/admin/ping", authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  res.json({
    admin: true,
    message: "Admin access granted",
  });
});

// Service areas endpoint
app.get("/service-areas", (req: Request, res: Response) => {
  res.json({
    areas: serviceAreas,
  });
});

// Check service availability by lat/lng (for frontend)
app.post("/api/service-areas/check", (req: Request, res: Response) => {
  const { lat, lng, state } = req.body;
  
  // For now, accept all Connecticut addresses
  if (state === 'CT') {
    res.json({
      covered: true,
      serviceArea: {
        id: 1,
        name: 'Connecticut'
      }
    });
  } else {
    res.json({
      covered: false
    });
  }
});

// Check service availability by zip code
app.get("/service-areas/check/:zipCode", (req: Request, res: Response) => {
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
app.post("/driver-application", async (req: Request, res: Response) => {
  const { name, email, phone, city, state, vehicleType, experience } = req.body;

  if (!name || !email || !phone || !city || !state) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const application: DriverApplication = {
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
app.get("/driver-applications", authenticateToken, (req: AuthRequest, res: Response) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  res.json({
    applications: driverApplications,
  });
});

// =====================================================
// ADMIN ROUTES
// =====================================================

// Admin Auth
app.post("/admin/auth/login", adminRoutes.adminLogin);
app.get("/admin/auth/me", authenticateToken, adminRoutes.requireAdmin, adminRoutes.adminMe);

// Admin Stats
app.get("/admin/stats/overview", authenticateToken, adminRoutes.requireAdmin, adminRoutes.getStatsOverview);

// Admin Drivers
app.get("/admin/drivers", authenticateToken, adminRoutes.requireAdmin, adminRoutes.getDrivers);
app.get("/admin/drivers/:id", authenticateToken, adminRoutes.requireAdmin, adminRoutes.getDriver);
app.put("/admin/drivers/:id/status", authenticateToken, adminRoutes.requireAdmin, adminRoutes.updateDriverStatus);

// Admin Customers
app.get("/admin/customers", authenticateToken, adminRoutes.requireAdmin, adminRoutes.getCustomers);
app.get("/admin/customers/:id", authenticateToken, adminRoutes.requireAdmin, adminRoutes.getCustomer);

// Admin Orders
app.get("/admin/orders", authenticateToken, adminRoutes.requireAdmin, adminRoutes.getOrders);
app.get("/admin/orders/:id", authenticateToken, adminRoutes.requireAdmin, adminRoutes.getOrder);
app.put("/admin/orders/:id/assign", authenticateToken, adminRoutes.requireAdmin, adminRoutes.assignOrder);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
