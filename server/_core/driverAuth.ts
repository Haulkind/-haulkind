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

// JWT middleware helper
function verifyToken(req: any): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'secret');
  } catch (e) {
    return null;
  }
}

export function registerDriverAuthRoutes(app: Express) {

  // ============================================================================
  // DATABASE SETUP - Ensure tables exist
  // ============================================================================
  (async () => {
    try {
      const pool = await getPgPool();
      if (pool) {
        // Ensure driver address columns exist
        await pool.query(`
          ALTER TABLE drivers 
          ADD COLUMN IF NOT EXISTS first_name TEXT,
          ADD COLUMN IF NOT EXISTS last_name TEXT,
          ADD COLUMN IF NOT EXISTS address TEXT,
          ADD COLUMN IF NOT EXISTS city TEXT,
          ADD COLUMN IF NOT EXISTS state TEXT,
          ADD COLUMN IF NOT EXISTS zip_code TEXT,
          ADD COLUMN IF NOT EXISTS vehicle_type TEXT,
          ADD COLUMN IF NOT EXISTS vehicle_capacity TEXT,
          ADD COLUMN IF NOT EXISTS lifting_limit TEXT,
          ADD COLUMN IF NOT EXISTS license_plate TEXT,
          ADD COLUMN IF NOT EXISTS services TEXT,
          ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false
        `);
        console.log('[DriverAuth] Driver columns ensured');

        // Create jobs table if not exists (PostgreSQL syntax)
        await pool.query(`
          CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
            customer_id TEXT,
            customer_name TEXT,
            customer_phone TEXT,
            customer_email TEXT,
            service_type TEXT DEFAULT 'HAUL_AWAY',
            status TEXT DEFAULT 'pending',
            pickup_address TEXT,
            pickup_lat DECIMAL(10,7),
            pickup_lng DECIMAL(10,7),
            dropoff_address TEXT,
            description TEXT,
            items_json TEXT,
            estimated_price DECIMAL(10,2),
            final_price DECIMAL(10,2),
            assigned_driver_id TEXT,
            scheduled_for TIMESTAMP,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('[DriverAuth] Jobs table ensured');

        // Create job_assignments table if not exists
        await pool.query(`
          CREATE TABLE IF NOT EXISTS job_assignments (
            id SERIAL PRIMARY KEY,
            job_id TEXT REFERENCES jobs(id),
            driver_id TEXT,
            status TEXT DEFAULT 'assigned',
            assigned_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('[DriverAuth] Job assignments table ensured');

        // Also create orders view/table for admin compatibility
        await pool.query(`
          CREATE OR REPLACE VIEW orders AS
          SELECT 
            id, service_type, customer_name, customer_phone as phone,
            customer_email as email, pickup_address as street,
            '' as city, '' as state, '' as zip,
            pickup_lat as lat, pickup_lng as lng,
            scheduled_for as pickup_date, '' as pickup_time_window,
            items_json, estimated_price as pricing_json,
            status, assigned_driver_id,
            created_at, updated_at
          FROM jobs
        `);
        console.log('[DriverAuth] Orders view ensured');
      }
    } catch (e) {
      console.log('[DriverAuth] DB setup note:', (e as any)?.message);
    }
  })();

  // ============================================================================
  // DIAGNOSTIC ENDPOINTS
  // ============================================================================

  // GET /api/db/tables - List all tables in the database
  app.get('/api/db/tables', async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });
      const result = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' ORDER BY table_name
      `);
      res.json({ tables: result.rows.map((r: any) => r.table_name) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ============================================================================
  // ORDER CREATION ENDPOINTS (for Dashboard and Customer flow)
  // ============================================================================

  // POST /api/orders/create - Create a new order/job
  app.post('/api/orders/create', async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const {
        customerName, customerPhone, customerEmail,
        serviceType, pickupAddress, dropoffAddress,
        description, estimatedPrice, items, scheduledFor
      } = req.body;

      if (!customerName || !pickupAddress) {
        return res.status(400).json({ error: 'customerName and pickupAddress are required' });
      }

      const result = await pool.query(
        `INSERT INTO jobs (
          customer_name, customer_phone, customer_email,
          service_type, status, pickup_address, dropoff_address,
          description, estimated_price, items_json, scheduled_for,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *`,
        [
          customerName,
          customerPhone || '',
          customerEmail || '',
          serviceType || 'HAUL_AWAY',
          pickupAddress,
          dropoffAddress || '',
          description || '',
          estimatedPrice || 0,
          items ? JSON.stringify(items) : '[]',
          scheduledFor || null
        ]
      );

      const job = result.rows[0];
      console.log(`[Orders] New job created: ${job.id} - ${customerName}`);
      res.json({ success: true, order: job });
    } catch (err: any) {
      console.error('Create order error:', err);
      res.status(500).json({ error: 'Failed to create order', details: err.message });
    }
  });

  // GET /api/orders - List all orders (public for now)
  app.get('/api/orders', async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { status, limit = 50 } = req.query;
      let query = 'SELECT * FROM jobs WHERE 1=1';
      const params: any[] = [];
      let idx = 1;

      if (status) {
        query += ` AND status = $${idx++}`;
        params.push(status);
      }
      query += ` ORDER BY created_at DESC LIMIT $${idx++}`;
      params.push(limit);

      const result = await pool.query(query, params);
      res.json({ orders: result.rows, total: result.rows.length });
    } catch (err: any) {
      console.error('List orders error:', err);
      res.status(500).json({ error: 'Failed to list orders' });
    }
  });

  // PUT /api/orders/:id/assign - Assign order to driver (admin)
  app.put('/api/orders/:id/assign', async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { driver_id } = req.body;
      if (!driver_id) return res.status(400).json({ error: 'driver_id required' });

      await pool.query(
        `UPDATE jobs SET assigned_driver_id = $1, status = 'assigned', updated_at = NOW() WHERE id = $2`,
        [driver_id, req.params.id]
      );

      // Create assignment record
      await pool.query(
        `INSERT INTO job_assignments (job_id, driver_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [req.params.id, driver_id]
      );

      const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
      res.json({ success: true, order: result.rows[0] });
    } catch (err: any) {
      console.error('Assign order error:', err);
      res.status(500).json({ error: 'Failed to assign order' });
    }
  });

  // ============================================================================
  // DRIVER AUTH ENDPOINTS
  // ============================================================================

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

      // Check if user already exists
      const existingResult = await pool.query(
        'SELECT id FROM users WHERE email = $1 LIMIT 1',
        [email]
      );
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const existingDriver = await pool.query(
        'SELECT id FROM drivers WHERE email = $1 LIMIT 1',
        [email]
      );
      if (existingDriver.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered as driver' });
      }

      const fullName = firstName && lastName ? `${firstName} ${lastName}` : (name || '');
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert into users table
      const insertResult = await pool.query(
        `INSERT INTO users (email, name, phone, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [email, fullName, phone || null, hashedPassword]
      );
      const userId = insertResult.rows[0]?.id;

      // Insert into drivers table with all fields
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

      const driverResult = await pool.query(
        'SELECT id, status, first_name, last_name, vehicle_type FROM drivers WHERE email = $1 LIMIT 1',
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
        driver: { 
          id: driver.id, 
          status: driver.status,
          firstName: driver.first_name,
          lastName: driver.last_name,
          vehicleType: driver.vehicle_type
        } 
      });
    } catch (err: any) {
      console.error('Driver login error:', err);
      res.status(500).json({ error: 'Internal server error', details: err?.message || String(err) });
    }
  });

  // POST /driver/onboarding - Save vehicle info and documents
  app.post('/driver/onboarding', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const { vehicleType, vehicleCapacity, liftingLimit, licensePlate, services } = req.body;

      await pool.query(
        `UPDATE drivers SET 
          vehicle_type = COALESCE($1, vehicle_type),
          vehicle_capacity = COALESCE($2, vehicle_capacity),
          lifting_limit = COALESCE($3, lifting_limit),
          license_plate = COALESCE($4, license_plate),
          services = COALESCE($5, services),
          updated_at = NOW()
        WHERE id = $6`,
        [
          vehicleType || null,
          vehicleCapacity || null,
          liftingLimit || null,
          licensePlate || null,
          services || null,
          decoded.driverId
        ]
      );

      res.json({ success: true, message: 'Onboarding data saved' });
    } catch (err: any) {
      console.error('Driver onboarding error:', err);
      res.status(500).json({ error: 'Failed to save onboarding data', details: err?.message });
    }
  });

  // POST /driver/online - Toggle online/offline status
  app.post('/driver/online', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const { online } = req.body;
      await pool.query(
        'UPDATE drivers SET is_online = $1, updated_at = NOW() WHERE id = $2',
        [!!online, decoded.driverId]
      );

      res.json({ success: true, online: !!online });
    } catch (err: any) {
      console.error('Driver online toggle error:', err);
      res.status(500).json({ error: 'Failed to update status' });
    }
  });

  // GET /driver/orders/available - Get available orders for driver
  app.get('/driver/orders/available', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      // Get orders that are pending assignment
      const result = await pool.query(
        `SELECT * FROM jobs WHERE status = 'pending' ORDER BY created_at DESC LIMIT 20`
      );

      res.json({ orders: result.rows || [] });
    } catch (err: any) {
      console.error('Get available orders error:', err);
      res.json({ orders: [] });
    }
  });

  // GET /driver/profile - Get driver profile
  app.get('/driver/profile', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const result = await pool.query(
        'SELECT * FROM drivers WHERE id = $1 LIMIT 1',
        [decoded.driverId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      const driver = result.rows[0];
      res.json({ 
        driver: {
          id: driver.id,
          name: driver.name,
          firstName: driver.first_name,
          lastName: driver.last_name,
          email: driver.email,
          phone: driver.phone,
          address: driver.address,
          city: driver.city,
          state: driver.state,
          zipCode: driver.zip_code,
          status: driver.status,
          vehicleType: driver.vehicle_type,
          vehicleCapacity: driver.vehicle_capacity,
          isOnline: driver.is_online,
          createdAt: driver.created_at
        }
      });
    } catch (err: any) {
      console.error('Get driver profile error:', err);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  // PUT /driver/profile - Update driver profile
  app.put('/driver/profile', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const { firstName, lastName, phone, address, city, state, zipCode } = req.body;
      const fullName = firstName && lastName ? `${firstName} ${lastName}` : undefined;

      await pool.query(
        `UPDATE drivers SET 
          name = COALESCE($1, name),
          first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          phone = COALESCE($4, phone),
          address = COALESCE($5, address),
          city = COALESCE($6, city),
          state = COALESCE($7, state),
          zip_code = COALESCE($8, zip_code),
          updated_at = NOW()
        WHERE id = $9`,
        [fullName, firstName, lastName, phone, address, city, state, zipCode, decoded.driverId]
      );

      res.json({ success: true, message: 'Profile updated' });
    } catch (err: any) {
      console.error('Update driver profile error:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // GET /driver/orders/history - Get order history
  app.get('/driver/orders/history', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      try {
        const result = await pool.query(
          `SELECT j.* FROM jobs j 
           JOIN job_assignments ja ON j.id = ja.job_id 
           WHERE ja.driver_id = $1 
           ORDER BY j.created_at DESC LIMIT 50`,
          [decoded.driverId]
        );
        res.json({ orders: result.rows || [] });
      } catch (e) {
        res.json({ orders: [] });
      }
    } catch (err: any) {
      console.error('Get order history error:', err);
      res.json({ orders: [] });
    }
  });

  // GET /driver/earnings - Get earnings summary
  app.get('/driver/earnings', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Return default earnings for now
      res.json({ 
        today: 0, 
        thisWeek: 0, 
        thisMonth: 0, 
        total: 0,
        completedJobs: 0,
        pendingPayout: 0
      });
    } catch (err: any) {
      console.error('Get earnings error:', err);
      res.json({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 });
    }
  });

  // POST /driver/orders/:id/accept - Accept an order
  app.post('/driver/orders/:id/accept', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const orderId = req.params.id;
      
      // Update job status
      await pool.query(
        "UPDATE jobs SET status = 'assigned', assigned_driver_id = $1, updated_at = NOW() WHERE id = $2",
        [decoded.driverId, orderId]
      );

      // Create assignment record
      try {
        await pool.query(
          `INSERT INTO job_assignments (job_id, driver_id) VALUES ($1, $2)`,
          [orderId, decoded.driverId]
        );
      } catch (e) {
        // ignore duplicate
      }

      res.json({ success: true, message: 'Order accepted' });
    } catch (err: any) {
      console.error('Accept order error:', err);
      res.status(500).json({ error: 'Failed to accept order' });
    }
  });

  // POST /driver/orders/:id/reject - Reject an order
  app.post('/driver/orders/:id/reject', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      res.json({ success: true, message: 'Order rejected' });
    } catch (err: any) {
      console.error('Reject order error:', err);
      res.status(500).json({ error: 'Failed to reject order' });
    }
  });

  // POST /driver/orders/:id/complete - Complete an order
  app.post('/driver/orders/:id/complete', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const orderId = req.params.id;
      
      await pool.query(
        "UPDATE jobs SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1",
        [orderId]
      );

      res.json({ success: true, message: 'Order completed' });
    } catch (err: any) {
      console.error('Complete order error:', err);
      res.status(500).json({ error: 'Failed to complete order' });
    }
  });
}
