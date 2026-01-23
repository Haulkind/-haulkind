import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db/index.js";
import { orders, drivers } from "./db/schema.js";
import { eq, desc } from "drizzle-orm";

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

  res.json({ admin: true, message: "Admin access granted" });
});

// ============================================
// SERVICE AREA ENDPOINTS
// ============================================

// Check if coordinates are in service area
app.get("/service-areas/lookup", (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      console.error('[SERVICE_AREA_LOOKUP] Missing parameters');
      return res.status(400).json({ error: "Latitude and longitude required" });
    }

    // Validate and parse coordinates
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      console.error('[SERVICE_AREA_LOOKUP] Invalid coordinates:', { lat, lng });
      return res.status(400).json({ error: "Invalid coordinates" });
    }


    // Expanded coverage: Philadelphia metro area and surrounding counties
    // Covers Philadelphia, Montgomery, Delaware, Chester, Bucks counties
    // Latitude: 39.7 to 40.3 (approx 40 miles north-south)
    // Longitude: -75.6 to -74.9 (approx 40 miles east-west)
    if (latitude >= 39.7 && latitude <= 40.3 && longitude >= -75.6 && longitude <= -74.9) {
      return res.json({
        covered: true,
        serviceArea: serviceAreas[0], // Philadelphia Metro
      });
    }

    // Outside service area
    res.json({
      covered: false,
      serviceArea: null,
    });
  } catch (error: any) {
    console.error('[SERVICE_AREA_LOOKUP] Unexpected error:', error.message, error.stack);
    res.status(500).json({ error: "Service area lookup failed", details: error.message });
  }
});

// Address autocomplete using Nominatim
app.get("/geocode/autocomplete", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 3) {
      return res.status(400).json({ error: "Query must be at least 3 characters" });
    }

    // Call Nominatim API
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(q)}&` +
      `format=json&` +
      `addressdetails=1&` +
      `countrycodes=us&` +
      `limit=5`;

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'Haulkind/1.0 (contact@haulkind.com)'
      }
    });

    if (!response.ok) {
      console.error('[AUTOCOMPLETE] Nominatim error:', response.status, response.statusText);
      return res.status(502).json({ error: "Geocoding service unavailable" });
    }

    const data = await response.json() as any[];

    res.json(data);
  } catch (error: any) {
    console.error('[AUTOCOMPLETE] Unexpected error:', error.message, error.stack);
    res.status(500).json({ error: "Autocomplete failed", details: error.message });
  }
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
// JOB/ORDER ENDPOINTS (WITH DATABASE)
// ============================================

// Create order (replaces /jobs POST)
app.post("/jobs", async (req, res) => {
  try {
    const {
      serviceType,
      customerName,
      phone,
      email,
      street,
      city,
      state,
      zip,
      lat,
      lng,
      pickupDate,
      pickupTimeWindow,
      items,
      pricing,
    } = req.body;


    // Insert into database
    const [newOrder] = await db.insert(orders).values({
      serviceType,
      customerName,
      phone,
      email,
      street,
      city,
      state,
      zip,
      lat: lat?.toString(),
      lng: lng?.toString(),
      pickupDate,
      pickupTimeWindow,
      itemsJson: items,
      pricingJson: pricing,
      status: 'pending',
    }).returning();


    res.json({
      success: true,
      order: newOrder,
    });
  } catch (error: any) {
    console.error('[ORDER_CREATE] Error:', error.message, error.stack);
    res.status(500).json({ error: "Failed to create order", details: error.message });
  }
});

// List all orders (for admin)
app.get("/orders", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(50);

    res.json({
      orders: allOrders,
    });
  } catch (error: any) {
    console.error('[ORDERS_LIST] Error:', error.message);
    res.status(500).json({ error: "Failed to fetch orders", details: error.message });
  }
});

// Get order by ID
app.get("/orders/:id", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error: any) {
    console.error('[ORDER_GET] Error:', error.message);
    res.status(500).json({ error: "Failed to fetch order", details: error.message });
  }
});

// Update order status
app.patch("/orders/:id/status", authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;


    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }


    res.json(updatedOrder);
  } catch (error: any) {
    console.error('[ORDER_UPDATE_STATUS] Error:', error.message);
    res.status(500).json({ error: "Failed to update order status", details: error.message });
  }
});

// Assign driver to order
app.patch("/orders/:id/assign", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { id } = req.params;
    const { driverId } = req.body;


    const [updatedOrder] = await db
      .update(orders)
      .set({ assignedDriverId: driverId, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }


    res.json(updatedOrder);
  } catch (error: any) {
    console.error('[ORDER_ASSIGN_DRIVER] Error:', error.message);
    res.status(500).json({ error: "Failed to assign driver", details: error.message });
  }
});

// ============================================
// DRIVER ENDPOINTS
// ============================================

// List all drivers
app.get("/drivers", authenticateToken, async (req: any, res) => {
  try {
    const allDrivers = await db
      .select()
      .from(drivers)
      .orderBy(desc(drivers.createdAt));

    res.json({
      drivers: allDrivers,
    });
  } catch (error: any) {
    console.error('[DRIVERS_LIST] Error:', error.message);
    res.status(500).json({ error: "Failed to fetch drivers", details: error.message });
  }
});

// Create or update driver
app.post("/drivers", authenticateToken, async (req: any, res) => {
  try {
    const { name, phone, email, status = 'available' } = req.body;


    const [newDriver] = await db.insert(drivers).values({
      name,
      phone,
      email,
      status,
    }).returning();


    res.json(newDriver);
  } catch (error: any) {
    console.error('[DRIVER_CREATE] Error:', error.message);
    res.status(500).json({ error: "Failed to create driver", details: error.message });
  }
});

// ============================================
// DRIVER APPLICATION ENDPOINTS (UNCHANGED)
// ============================================

// Submit driver application
app.post("/driver-applications", (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    city,
    state,
    zip,
    hasVehicle,
    vehicleType,
    hasLicense,
    canLiftHeavy,
    availability,
  } = req.body;

  const application = {
    id: applicationIdCounter++,
    firstName,
    lastName,
    email,
    phone,
    city,
    state,
    zip,
    hasVehicle,
    vehicleType,
    hasLicense,
    canLiftHeavy,
    availability,
    status: "pending",
    submittedAt: new Date().toISOString(),
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
});
