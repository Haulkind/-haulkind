import { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Use raw pg connection since DATABASE_URL is PostgreSQL but drizzle is configured for mysql2
// This ensures driver auth works regardless of the drizzle ORM configuration
let pgPool: any = null;

async function getPgPool() {
  if (pgPool) return pgPool;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  
  try {
    // Dynamic import pg
    const { default: pg } = await import("pg");
    pgPool = new pg.Pool({ 
      connectionString: dbUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    // Test connection
    const client = await pgPool.connect();
    client.release();
    console.log('[DriverAuth] PostgreSQL connection established');
    return pgPool;
  } catch (e) {
    console.error('[DriverAuth] Failed to connect to PostgreSQL:', e);
    pgPool = null;
    return null;
  }
}

async function ensureDriverTables(pool: any) {
  try {
    // Add password_hash column if it doesn't exist
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
    `).catch(() => {});
    
    // Add phone column if it doesn't exist
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
    `).catch(() => {});

    // Check if role enum has 'driver' value, if not add it
    await pool.query(`
      ALTER TYPE users_role ADD VALUE IF NOT EXISTS 'driver'
    `).catch(() => {});
    
    await pool.query(`
      ALTER TYPE users_role ADD VALUE IF NOT EXISTS 'customer'
    `).catch(() => {});

    console.log('[DriverAuth] Database tables verified');
  } catch (e) {
    console.warn('[DriverAuth] Table migration warning:', e);
  }
}

export function registerDriverAuthRoutes(app: Express) {
  let tablesEnsured = false;

  // POST /driver/auth/signup
  app.post('/driver/auth/signup', async (req, res) => {
    try {
      const { email, password, name, phone } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      if (!tablesEnsured) {
        await ensureDriverTables(pool);
        tablesEnsured = true;
      }

      // Check if user already exists
      const existingResult = await pool.query(
        'SELECT id FROM users WHERE email = $1 LIMIT 1',
        [email]
      );
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const openId = `driver_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      // Insert new user
      const insertResult = await pool.query(
        `INSERT INTO users ("openId", name, email, phone, password_hash, "loginMethod", role, "createdAt", "updatedAt", "lastSignedIn")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
         RETURNING id`,
        [openId, name || '', email, phone || null, hashedPassword, 'email', 'driver']
      );
      const userId = insertResult.rows[0]?.id;
      if (!userId) {
        return res.status(500).json({ error: 'Failed to create user account' });
      }

      // Insert driver record
      const driverResult = await pool.query(
        `INSERT INTO drivers ("userId", status, "isOnline", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id`,
        [userId, 'pending', false]
      );
      const driverId = driverResult.rows[0]?.id;

      const token = jwt.sign(
        { userId, email, role: 'driver', driverId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      res.json({ success: true, token, driver: { id: driverId, userId, email, status: 'pending' } });
    } catch (error: any) {
      console.error('Driver signup error:', error);
      res.status(500).json({ error: 'Failed to create account', details: error?.message || String(error) });
    }
  });

  // POST /driver/auth/login
  app.post('/driver/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      // Get user with password_hash
      const result = await pool.query(
        `SELECT id, email, password_hash, name, role FROM users WHERE email = $1 AND role = 'driver' LIMIT 1`,
        [email]
      );
      const user = result.rows[0];

      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Get driver record
      const driverResult = await pool.query(
        `SELECT id, status, "isOnline" FROM drivers WHERE "userId" = $1 LIMIT 1`,
        [user.id]
      );
      const driver = driverResult.rows[0];

      if (!driver) {
        return res.status(404).json({ error: 'Driver profile not found' });
      }
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, driverId: driver.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );
      res.json({ token, user: { id: user.id, email: user.email, role: user.role }, driver: { id: driver.id, status: driver.status } });
    } catch (err: any) {
      console.error('Driver login error:', err);
      res.status(500).json({ error: 'Internal server error', details: err?.message || String(err) });
    }
  });
}
