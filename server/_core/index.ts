import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { healthRouter } from "./health";
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
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Health check endpoint
  app.use(healthRouter);
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

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

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
