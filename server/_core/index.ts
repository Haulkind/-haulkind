import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
// import { serveStatic } from "./static"; // Disabled temporarily
import { healthRouter } from "./health";
import { registerDriverAuthRoutes } from "./driverAuth";
import { registerAdminAuthRoutes } from "./adminAuth";
import { registerAdminApiRoutes } from "./adminApi";
import { initializeSocket } from "./socket";
import { realtimeRouter } from "./realtime";
import { migrateRouter } from "./migrate";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Enable CORS for admin dashboard and other frontends (manual headers for reliability)
  // Force rebuild to ensure CORS is applied - 2026-02-12
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'https://exciting-bravery-production.up.railway.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Check if origin matches allowed patterns
    if (origin && (allowedOrigins.includes(origin) || /\.up\.railway\.app$/.test(origin) || /\.vercel\.app$/.test(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health check endpoint
  app.use(healthRouter);
  
  // Realtime polling endpoints
  app.use(realtimeRouter);
  
  // Migration endpoints (temporary)
  app.use(migrateRouter);
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // ============================================
  // Customer Auth Routes (signup/login for mobile app)
  // Uses the 'users' table directly with password_hash
  // Table structure: id, email, password_hash, role, full_name, phone, created_at, updated_at
  // ============================================
  
  // POST /customer/auth/signup
  app.post('/customer/auth/signup', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
      }
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }
      
      // Check if user already exists
      const existingResult = await db.execute(sql`
        SELECT id FROM users WHERE email = ${email} LIMIT 1
      `);
      const existing = (existingResult as any)[0] || [];
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert new user
      const insertResult = await db.execute(sql`
        INSERT INTO users (email, password_hash, role, full_name, created_at, updated_at)
        VALUES (${email}, ${hashedPassword}, 'customer', ${name}, NOW(), NOW())
      `);
      
      const userId = (insertResult as any)[0]?.insertId;
      
      if (!userId) {
        return res.status(500).json({ error: 'Failed to create user account' });
      }
      
      // Create corresponding customer record
      await db.execute(sql`
        INSERT INTO customers (user_id, name, email, created_at)
        VALUES (${userId}, ${name}, ${email}, NOW())
      `);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId, email, role: 'customer' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      
      res.json({
        success: true,
        token,
        customer: { id: userId, name, email }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Failed to create account', details: String(error) });
    }
  });

  // POST /customer/auth/login
  app.post('/customer/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }
      
      // Find user
      const result = await db.execute(sql`
        SELECT id, email, password_hash, full_name, role FROM users WHERE email = ${email} LIMIT 1
      `);
      const rows = (result as any)[0] || [];
      const user = rows[0];
      
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      
      res.json({
        success: true,
        token,
        customer: { id: user.id, name: user.full_name, email: user.email }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login', details: String(error) });
    }
  });

  // ============================================
  // End Customer Auth Routes
  // ============================================

  // ============================================
  // Driver Auth Routes (signup/login for driver app)
  // ============================================
  registerDriverAuthRoutes(app);
  // ============================================
  // End Driver Auth Routes
  // ============================================

  // ============================================
  // Admin Auth and API Routes
  // ============================================
  registerAdminAuthRoutes(app);
  registerAdminApiRoutes(app);
  // ============================================
  // End Admin Routes
  // ============================================

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  // Temporarily disabled to avoid route conflicts
  // if (process.env.NODE_ENV === "development") {
  //   const { setupVite } = await import("./vite");
  //   await setupVite(app, server);
  // } else {
  //   // serveStatic(app); // Commented out to avoid conflicts with Socket.io - will configure later when needed
  // }

  // Initialize Socket.io for real-time communication
  initializeSocket(server);
  console.log('[Server] Socket.io initialized');

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
