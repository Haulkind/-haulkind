import "dotenv/config";import express from "express";import { createServer } from "http";import net from "net";import { createExpressMiddleware } from "@trpc/server/adapters/express";import { registerOAuthRoutes } from "./oauth";import { appRouter } from "../routers";import { createContext } from "./context";import { serveStatic, setupVite } from "./vite";function isPortAvailable(port: number): Promise<boolean> {  return new Promise(resolve => {    const server = net.createServer();    server.listen(port, () => {      server.close(() => resolve(true));    });    server.on("error", () => resolve(false));  });}async function findAvailablePort(startPort: number = 3000): Promise<number> {  for (let port = startPort; port < startPort + 20; port++) {    if (await isPortAvailable(port)) {      return port;    }  }  throw new Error(`No available port found starting from ${startPort}`);}async function startServer() {  const app = express();  const server = createServer(app);    // CORS configuration  app.use((req, res, next) => {    const allowedOrigins = [      'https://haulkind.com',      'https://www.haulkind.com',      'http://localhost:5173', // dev      'http://localhost:3000'  // dev    ];    const origin = req.headers.origin;    if (origin && allowedOrigins.includes(origin)) {      res.setHeader('Access-Control-Allow-Origin', origin);    }    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');    res.setHeader('Access-Control-Allow-Credentials', 'true');        if (req.method === 'OPTIONS') {      return res.sendStatus(200);    }    next();  });    // Configure body parser with larger size limit for file uploads  app.use(express.json({ limit: "50mb" }));  app.use(express.urlencoded({ limit: "50mb", extended: true }));    // Health check endpoint  app.get('/health', (req, res) => {    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });  });  // OAuth callback under /api/oauth/callback  registerOAuthRoutes(app);

  // Customer Auth Routes (signup/login for mobile app)
  app.post('/customer/auth/signup', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required' });
      }
      
      // Import db and customers from drizzle
      const { db } = await import('../db');
      const { customers } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const bcrypt = await import('bcryptjs');
      const jwt = await import('jsonwebtoken');
      
      // Check if customer already exists
      const existing = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // Hash password and create customer
      const hashedPassword = await bcrypt.hash(password, 10);
      const [newCustomer] = await db.insert(customers).values({
        name,
        email,
        password: hashedPassword,
      }).returning();
      
      // Generate JWT token
      const token = jwt.sign({ customerId: newCustomer.id, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      
      res.json({ success: true, token, customer: { id: newCustomer.id, name: newCustomer.name, email: newCustomer.email } });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Failed to create account', details: String(error) });
    }
  });

  app.post('/customer/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const { db } = await import('../db');
      const { customers } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const bcrypt = await import('bcryptjs');
      const jwt = await import('jsonwebtoken');
      
      // Find customer
      const [customer] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
      if (!customer || !customer.password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Verify password
      const isValid = await bcrypt.compare(password, customer.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign({ customerId: customer.id, email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      
      res.json({ success: true, token, customer: { id: customer.id, name: customer.name, email: customer.email } });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login', details: String(error) });
    }
  });
  // tRPC API  app.use(    "/api/trpc",    createExpressMiddleware({      router: appRouter,
