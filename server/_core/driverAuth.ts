import { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

let migrationDone = false;

async function ensureDriverColumns(db: any) {
  if (migrationDone) return;
  try {
    // Add password_hash column if it doesn't exist
    await db.execute(sql`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)`).catch(() => {});
    // Add phone column if it doesn't exist
    await db.execute(sql`ALTER TABLE users ADD COLUMN phone VARCHAR(20)`).catch(() => {});
    // Modify role enum to include customer and driver
    await db.execute(sql`ALTER TABLE users MODIFY COLUMN role ENUM('user','admin','customer','driver') NOT NULL DEFAULT 'user'`).catch(() => {});
    migrationDone = true;
    console.log('[DriverAuth] Database columns verified/updated');
  } catch (e) {
    console.warn('[DriverAuth] Migration warning (may be OK):', e);
    migrationDone = true;
  }
}

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

      // Ensure required columns exist
      await ensureDriverColumns(db);

      // Check if user already exists
      const existingResult = await db.execute(sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`);
      const existingRows = Array.isArray(existingResult) ? (existingResult as any)[0] : existingResult;
      const existingArr = Array.isArray(existingRows) ? existingRows : [];
      if (existingArr.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate a unique openId (required NOT NULL field in users table)
      const openId = `driver_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      // Insert new user with correct column names from migration 0000
      // Columns: id, openId, name, email, phone, password_hash, loginMethod, role, createdAt, updatedAt, lastSignedIn
      const insertResult = await db.execute(sql`
        INSERT INTO users (openId, name, email, phone, password_hash, loginMethod, role, createdAt, updatedAt, lastSignedIn)
        VALUES (${openId}, ${name || ''}, ${email}, ${phone || null}, ${hashedPassword}, 'email', 'driver', NOW(), NOW(), NOW())
      `);
      const insertData = Array.isArray(insertResult) ? (insertResult as any)[0] : insertResult;
      const userId = (insertData as any)?.insertId;
      if (!userId) {
        return res.status(500).json({ error: 'Failed to create user account' });
      }

      // Insert driver record with correct column names and enum values
      // drivers.status enum: 'pending', 'approved', 'blocked'
      const driverInsertResult = await db.execute(sql`
        INSERT INTO drivers (userId, status, isOnline, createdAt, updatedAt)
        VALUES (${userId}, 'pending', false, NOW(), NOW())
      `);
      const driverData = Array.isArray(driverInsertResult) ? (driverInsertResult as any)[0] : driverInsertResult;
      const driverId = (driverData as any)?.insertId;

      const token = jwt.sign(
        { userId, email, role: 'driver', driverId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      res.json({ success: true, token, driver: { id: driverId, userId, email, status: 'pending' } });
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

      // Ensure required columns exist
      await ensureDriverColumns(db);

      // Get user with password_hash
      const result = await db.execute(sql`SELECT id, email, password_hash, name, role FROM users WHERE email = ${email} AND role = 'driver' LIMIT 1`);
      const rows = Array.isArray(result) ? (result as any)[0] : result;
      const rowsArr = Array.isArray(rows) ? rows : [];
      const user = rowsArr[0];

      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Get driver record
      const driverResult = await db.execute(sql`SELECT id, status, isOnline FROM drivers WHERE userId = ${user.id} LIMIT 1`);
      const driverRows = Array.isArray(driverResult) ? (driverResult as any)[0] : driverResult;
      const driverArr = Array.isArray(driverRows) ? driverRows : [];
      const driver = driverArr[0];

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
      res.status(500).json({ error: 'Internal server error', details: String(err) });
    }
  });
}
