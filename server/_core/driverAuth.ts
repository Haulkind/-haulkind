import { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

export function registerDriverAuthRoutes(app: Express) {
  // POST /driver/auth/signup
  app.post('/driver/auth/signup', async (req, res) => {
    try {
      const { email, password, name, phone } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }
      const existingResult = await db.execute(sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`);
      const existing = (existingResult as any)[0] || [];
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertResult = await db.execute(sql`
        INSERT INTO users (email, password_hash, role, full_name, phone, created_at, updated_at)
        VALUES (${email}, ${hashedPassword}, 'driver', ${name || ''}, ${phone || null}, NOW(), NOW())
      `);
      const userId = (insertResult as any)[0]?.insertId;
      if (!userId) {
        return res.status(500).json({ error: 'Failed to create user account' });
      }
      const driverInsertResult = await db.execute(sql`
        INSERT INTO drivers (user_id, status, is_online, created_at, updated_at)
        VALUES (${userId}, 'pending_onboarding', false, NOW(), NOW())
      `);
      const driverId = (driverInsertResult as any)[0]?.insertId;
      const token = jwt.sign(
        { userId, email, role: 'driver', driverId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      res.json({ success: true, token, driver: { id: driverId, userId, email, status: 'pending_onboarding' } });
    } catch (error) {
      console.error('Driver signup error:', error);
      res.status(500).json({ error: 'Failed to create account', details: String(error) });
    }
  });

  // POST /driver/auth/login
  app.post('/driver/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ error: 'Database not available' });
      }
      const result = await db.execute(sql`SELECT id, email, password_hash, full_name, role FROM users WHERE email = ${email} AND role = 'driver' LIMIT 1`);
      const rows = (result as any)[0] || [];
      const user = rows[0];
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const driverResult = await db.execute(sql`SELECT id, status, is_online FROM drivers WHERE user_id = ${user.id} LIMIT 1`);
      const driverRows = (driverResult as any)[0] || [];
      const driver = driverRows[0];
      if (!driver) {
        return res.status(404).json({ error: 'Driver profile not found' });
      }
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, driverId: driver.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      res.json({ token, user: { id: user.id, email: user.email, role: user.role }, driver: { id: driver.id, status: driver.status } });
    } catch (err) {
      console.error('Driver login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
