// BUILD_VERSION: 2026-02-22-v2
import "dotenv/config";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db/index.js";
import { orders } from "./db/schema.js";
import * as adminRoutes from "./admin-routes.js";
import * as driverRoutes from "./driver-routes.js";
import { desc, sql } from "drizzle-orm";
const app = express();
// CORS configuration
const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://haulkind-web.vercel.app";
const allowedOrigins = CORS_ORIGIN.split(",").map(o => o.trim());
app.use(cors({
    origin: true,
    credentials: true,
}));
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
const driverApplications = [];
let applicationIdCounter = 1;
// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "No token provided" });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        req.user = user;
        next();
    });
};
// Middleware to verify DEBUG_TOKEN
const authenticateDebugToken = (req, res, next) => {
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
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }
        // Check if email already exists using raw SQL
        const existingUsers = await db.execute(sql `SELECT id FROM users WHERE email = ${email} LIMIT 1`);
        if (existingUsers.rows && existingUsers.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert user using raw SQL - using columns that exist in the table (id, email, password, name)
        const insertResult = await db.execute(sql `
      INSERT INTO users (email, password, name)
      VALUES (${email}, ${hashedPassword}, ${name})
      RETURNING id
    `);
        const userId = insertResult.rows[0].id;
        // Create customer record - using columns that exist (id, user_id)
        await db.execute(sql `
      INSERT INTO customers (user_id)
      VALUES (${userId})
    `);
        // Generate JWT token
        const token = jwt.sign({ id: userId, email, role: 'user', name }, JWT_SECRET, { expiresIn: '30d' });
        res.json({
            success: true,
            token,
            customer: { id: userId, name, email }
        });
    }
    catch (error) {
        console.error('[CUSTOMER_SIGNUP] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: 'Failed to create account', details: errorMessage });
    }
});
// POST /customer/auth/login
app.post('/customer/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Find user by email using raw SQL - using columns that exist (id, email, password, name)
        const userResult = await db.execute(sql `
      SELECT id, email, password, name 
      FROM users 
      WHERE email = ${email} 
      LIMIT 1
    `);
        if (!userResult.rows || userResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = userResult.rows[0];
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate JWT token
        const token = jwt.sign({ id: user.id, email: user.email, role: 'user', name: user.name }, JWT_SECRET, { expiresIn: '30d' });
        res.json({
            success: true,
            token,
            customer: { id: user.id, name: user.name, email: user.email }
        });
    }
    catch (error) {
        console.error('[CUSTOMER_LOGIN] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: 'Login failed', details: errorMessage });
    }
});
// GET /customer/auth/me - Get current customer profile
app.get('/customer/auth/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // Using columns that exist (id, email, password, name)
        const userResult = await db.execute(sql `
      SELECT id, email, name
      FROM users 
      WHERE id = ${userId} 
      LIMIT 1
    `);
        if (!userResult.rows || userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = userResult.rows[0];
        res.json({
            success: true,
            customer: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: 'user'
            }
        });
    }
    catch (error) {
        console.error('[CUSTOMER_ME] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: 'Failed to get profile', details: errorMessage });
    }
});
// =====================================================
// END CUSTOMER AUTH ROUTES
// =====================================================
// POST /quotes - Calculate quote for junk removal
app.post('/quotes', async (req, res) => {
    try {
        const { serviceType, serviceAreaId, pickupLat, pickupLng, pickupAddress, scheduledFor, volumeTier, addons } = req.body;
        // Base prices for different volumes
        const volumePrices = {
            'EIGHTH': 109,
            'QUARTER': 169,
            'HALF': 279,
            'THREE_QUARTER': 389,
            'FULL': 529
        };
        const basePrice = volumePrices[volumeTier] || 169;
        // Calculate addon prices
        let addonTotal = 0;
        const breakdown = [
            { label: `${volumeTier} Truck Load`, amount: basePrice }
        ];
        // Addons is an array of strings like ['SAME_DAY', 'HEAVY_ITEM']
        if (addons && Array.isArray(addons)) {
            if (addons.includes('SAME_DAY')) {
                addonTotal += 50;
                breakdown.push({ label: 'Same-Day Service', amount: 50 });
            }
            if (addons.includes('HEAVY_ITEM')) {
                addonTotal += 25;
                breakdown.push({ label: 'Heavy Item', amount: 25 });
            }
            if (addons.includes('STAIRS')) {
                addonTotal += 20;
                breakdown.push({ label: 'Stairs', amount: 20 });
            }
            if (addons.includes('DISASSEMBLY')) {
                addonTotal += 30;
                breakdown.push({ label: 'Disassembly', amount: 30 });
            }
        }
        const total = basePrice + addonTotal;
        res.json({
            success: true,
            total,
            breakdown,
            disposalIncluded: 50,
            servicePrice: basePrice,
            addonPrice: addonTotal,
            distancePrice: 0,
            serviceType,
            pickupAddress,
            volumeTier,
            scheduledFor
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[QUOTES] Error:', errorMessage);
        res.status(500).json({ error: 'Failed to calculate quote', details: errorMessage });
    }
});
// POST /jobs - Create a new job/order
app.post('/jobs', async (req, res) => {
    try {
        const { serviceType, serviceAreaId, pickupLat, pickupLng, pickupAddress, scheduledFor, volumeTier, addons, helperCount, estimatedHours, customerNotes, photoUrls } = req.body;
        // Parse address from pickupAddress string
        const addressParts = pickupAddress.split(',').map((p) => p.trim());
        const street = addressParts[0] || '';
        const city = addressParts[1] || '';
        const stateZip = addressParts[2] || '';
        const [state, zip] = stateZip.split(' ').filter(Boolean);
        // Calculate total price (same logic as /quotes endpoint)
        const volumePrices = {
            'EIGHTH': 109,
            'QUARTER': 169,
            'HALF': 279,
            'THREE_QUARTER': 389,
            'FULL': 529
        };
        const basePrice = volumePrices[volumeTier] || 169;
        let addonTotal = 0;
        if (addons && Array.isArray(addons)) {
            if (addons.includes('SAME_DAY'))
                addonTotal += 50;
            if (addons.includes('HEAVY_ITEM'))
                addonTotal += 25;
            if (addons.includes('STAIRS'))
                addonTotal += 20;
            if (addons.includes('DISASSEMBLY'))
                addonTotal += 30;
        }
        const total = basePrice + addonTotal;
        // Get customer info from request (assuming it's in pickupAddress or separate fields)
        const customerName = req.body.customerName || 'Customer';
        const customerPhone = req.body.customerPhone || '';
        const customerEmail = req.body.customerEmail || '';
        // Insert order into database
        const insertResult = await db.execute(sql `
      INSERT INTO orders (
        service_type,
        customer_name,
        phone,
        email,
        street,
        city,
        state,
        zip,
        lat,
        lng,
        pickup_date,
        pickup_time_window,
        items_json,
        pricing_json,
        status
      ) VALUES (
        ${serviceType},
        ${customerName},
        ${customerPhone},
        ${customerEmail},
        ${street},
        ${city},
        ${state || 'Unknown'},
        ${zip || '00000'},
        ${pickupLat?.toString() || '0'},
        ${pickupLng?.toString() || '0'},
        ${scheduledFor},
        ${'ALL_DAY'},
        ${JSON.stringify({ volumeTier, addons, photoUrls, customerNotes })},
        ${JSON.stringify({ total, basePrice, addonTotal, disposalIncluded: 50 })},
        ${'pending'}
      )
      RETURNING id
    `);
        const orderId = insertResult.rows[0].id;
        res.json({
            success: true,
            id: orderId,
            status: 'pending',
            total
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[CREATE_JOB] Error:', errorMessage);
        res.status(500).json({ error: 'Failed to create job', details: errorMessage });
    }
});
// POST /jobs/:id/pay - Process payment for a job
app.post('/jobs/:id/pay', async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethodId } = req.body;
        // For now, just mark the order as paid (demo mode)
        await db.execute(sql `
      UPDATE orders
      SET status = 'paid'
      WHERE id = ${id}
    `);
        res.json({
            success: true,
            message: 'Payment processed successfully'
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[PAY_JOB] Error:', errorMessage);
        res.status(500).json({ error: 'Failed to process payment', details: errorMessage });
    }
});
// GET /jobs/:id - Get job status
app.get('/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.execute(sql `
      SELECT * FROM orders WHERE id = ${id} LIMIT 1
    `);
        if (!result.rows || result.rows.length === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        const order = result.rows[0];
        res.json({
            success: true,
            status: order.status,
            order
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[GET_JOB] Error:', errorMessage);
        res.status(500).json({ error: 'Failed to get job', details: errorMessage });
    }
});
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
    }
    catch (error) {
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
app.post("/create-admin", authenticateDebugToken, async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password and name are required' });
        }
        // Check if admin already exists
        const existingAdmin = await db.execute(sql `SELECT id FROM users WHERE email = ${email} LIMIT 1`);
        if (existingAdmin.rows && existingAdmin.rows.length > 0) {
            return res.status(400).json({ error: 'Admin already exists' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert admin user
        const insertResult = await db.execute(sql `
      INSERT INTO users (email, password_hash, full_name, role, phone)
      VALUES (${email}, ${hashedPassword}, ${name}, 'admin', '')
      RETURNING id
    `);
        const adminId = insertResult.rows[0].id;
        res.json({
            success: true,
            admin: { id: adminId, email, name, role: 'admin' }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[CREATE_ADMIN] Error:', errorMessage);
        res.status(500).json({ error: 'Failed to create admin', details: errorMessage });
    }
});
// Migration endpoint (protected by DEBUG_TOKEN)
app.post("/migrate", authenticateDebugToken, async (req, res) => {
    try {
        const { runMigrations } = await import("./migrate.js");
        const result = await runMigrations();
        res.json(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[MIGRATE] Error:', errorMessage);
        res.status(500).json({ error: "Migration failed", details: errorMessage });
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
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[DEBUG_ORDERS] Error:', errorMessage);
        res.status(500).json({ error: "Failed to fetch orders", details: errorMessage });
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
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
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
app.get("/auth/me", authenticateToken, (req, res) => {
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
app.get("/admin/ping", authenticateToken, (req, res) => {
    if (req.user?.role !== "admin") {
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
// Check service availability by lat/lng (for frontend)
app.post("/api/service-areas/check", (req, res) => {
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
    }
    else {
        res.json({
            covered: false
        });
    }
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
    }
    else {
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
app.get("/driver-applications", authenticateToken, (req, res) => {
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
// =====================================================
// DRIVER ROUTES
// =====================================================
// Driver Auth
app.post("/driver/auth/login", driverRoutes.driverLogin);
app.post("/driver/auth/signup", driverRoutes.driverSignup);
app.get("/driver/auth/me", authenticateToken, driverRoutes.requireDriver, driverRoutes.driverMe);
// Driver Profile (for native app)
app.get("/driver/profile", authenticateToken, driverRoutes.requireDriver, driverRoutes.getDriverProfile);
app.put("/driver/profile", authenticateToken, driverRoutes.requireDriver, driverRoutes.updateDriverProfile);
// Driver Jobs (original endpoints)
app.get("/driver/jobs/available", authenticateToken, driverRoutes.requireDriver, driverRoutes.getAvailableJobs);
app.get("/driver/jobs/my-jobs", authenticateToken, driverRoutes.requireDriver, driverRoutes.getMyJobs);
app.post("/driver/jobs/:id/accept", authenticateToken, driverRoutes.requireDriver, driverRoutes.acceptJob);
app.post("/driver/jobs/:id/start", authenticateToken, driverRoutes.requireDriver, driverRoutes.startJob);
app.post("/driver/jobs/:id/complete", authenticateToken, driverRoutes.requireDriver, driverRoutes.completeJob);
// Driver Orders ALIASES (native app uses /driver/orders/* instead of /driver/jobs/*)
app.get("/driver/orders/available", authenticateToken, driverRoutes.requireDriver, driverRoutes.getAvailableJobs);
app.get("/driver/orders/my-orders", authenticateToken, driverRoutes.requireDriver, driverRoutes.getMyJobs);
app.post("/driver/orders/:id/accept", authenticateToken, driverRoutes.requireDriver, driverRoutes.acceptJob);
app.post("/driver/orders/:id/start", authenticateToken, driverRoutes.requireDriver, driverRoutes.startJob);
app.post("/driver/orders/:id/complete", authenticateToken, driverRoutes.requireDriver, driverRoutes.completeJob);
// Driver Status endpoints (for Expo app)
app.post("/driver/status/online", authenticateToken, driverRoutes.requireDriver, driverRoutes.updateDriverProfile);
app.post("/driver/status/offline", authenticateToken, driverRoutes.requireDriver, driverRoutes.updateDriverProfile);
// Driver Active Job (for Expo app)
app.get("/driver/jobs/active", authenticateToken, driverRoutes.requireDriver, driverRoutes.getMyJobs);
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
