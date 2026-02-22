import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db } from "./db/index.js";
import { drivers, orders } from "./db/schema.js";
import { eq, and, isNull, or, desc } from "drizzle-orm";


const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";


interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; name?: string };
}


// Middleware to require driver role
export const requireDriver = (req: AuthRequest, res: Response, next: Function) => {
  if (!req.user || req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Driver access required' });
  }
  next();
};


// Driver Auth - Login
export const driverLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;


    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }


    // Find driver by email
    const [driver] = await db
      .select()
      .from(drivers)
      .where(eq(drivers.email, email))
      .limit(1);


    if (!driver) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }


    // Check if driver is approved, available, or active (all are valid statuses for login)
    if (driver.status !== 'approved' && driver.status !== 'available' && driver.status !== 'active') {
      return res.status(403).json({ error: 'Driver account not approved', status: driver.status });
    }


    // Verify password - if no password_hash set, allow login with any password (for seeded drivers)
    if (driver.passwordHash) {
      const passwordMatch = await bcrypt.compare(password, driver.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }


    // Generate JWT token
    const token = jwt.sign(
      { id: driver.id, email: driver.email, role: 'driver', name: driver.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );


    res.json({
      token,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
      },
