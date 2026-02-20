import type { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Use raw pg connection since DATABASE_URL is PostgreSQL
let pgPool: any = null;

async function getPgPool() {
  if (pgPool) return pgPool;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  
  try {
    const { default: pg } = await import("pg");
    pgPool = new pg.Pool({ 
      connectionString: dbUrl,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
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

export function registerDriverAuthRoutes(app: Express) {
  // POST /driver/auth/signup
  app.post('/driver/auth/signup', async (req, res) => {
    try {
      const { 
        email, password, name, phone, 
        firstName, lastName, address, city, state, zipCode 
      } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      // Check if user already exists in users table
      const existingResult = await pool.query(
        'SELECT id FROM users WHERE email = $1 LIMIT 1',
        [email]
      );
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Also check if driver with this email exists
      const existingDriver = await pool.query(
        'SELECT id FROM drivers WHERE email = $1 LIMIT 1',
        [email]
      );
      if (existingDriver.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered as driver' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Combine firstName and lastName if provided, otherwise use name
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : (name || '');

      // Insert into users table
      const insertResult = await pool.query(
        `INSERT INTO users (email, name, phone, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [email, fullName, phone || null, hashedPassword]
      );
      const userId = insertResult.rows[0]?.id;

      // Insert into drivers table with address fields
      // First, check if address columns exist, if not add them
      try {
        await pool.query(`
          ALTER TABLE drivers 
          ADD COLUMN IF NOT EXISTS first_name TEXT,
          ADD COLUMN IF NOT EXISTS last_name TEXT,
          ADD COLUMN IF NOT EXISTS address TEXT,
          ADD COLUMN IF NOT EXISTS city TEXT,
          ADD COLUMN IF NOT EXISTS state TEXT,
          ADD COLUMN IF NOT EXISTS zip_code TEXT
        `);
      } catch (e) {
        console.log('[DriverAuth] Address columns may already exist or migration failed:', e);
      }

      const driverResult = await pool.query(
        `INSERT INTO drivers (
          name, phone, email, status, 
          first_name, last_name, address, city, state, zip_code,
          created_at, updated_at
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
         RETURNING id`,
        [
          fullName, 
          phone || '', 
          email, 
          'pending',
          firstName || '',
          lastName || '',
          address || '',
          city || '',
          state || '',
          zipCode || ''
        ]
      );
      const driverId = driverResult.rows[0]?.id;

      const token = jwt.sign(
        { userId, email, role: 'driver', driverId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      res.json({ 
        success: true, 
        token, 
        driver: { 
          id: driverId, 
          userId, 
          email, 
          name: fullName,
          status: 'pending' 
        } 
      });
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

      // Get user with password_hash from users table
      const result = await pool.query(
        'SELECT id, email, password_hash, name FROM users WHERE email = $1 LIMIT 1',
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

      // Get driver record by email
      const driverResult = await pool.query(
        'SELECT id, status FROM drivers WHERE email = $1 LIMIT 1',
        [email]
      );
      const driver = driverResult.rows[0];
      if (!driver) {
        return res.status(404).json({ error: 'Driver profile not found' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: 'driver', driverId: driver.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      res.json({ 
        token, 
        user: { id: user.id, email: user.email, name: user.name }, 
        driver: { id: driver.id, status: driver.status } 
      });
    } catch (err: any) {
      console.error('Driver login error:', err);
      res.status(500).json({ error: 'Internal server error', details: err?.message || String(err) });
    }
  });
}
