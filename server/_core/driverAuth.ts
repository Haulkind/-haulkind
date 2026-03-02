import type { Express } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Driver commission rate: drivers receive 70% of the order value
const DRIVER_COMMISSION_RATE = 0.70;

// Apply driver commission to order price fields (driver sees 70%, Haulkind keeps 30%)
function applyDriverCommission(order: any): any {
  if (!order) return order;
  const copy = { ...order };
  if (copy.estimated_price != null) {
    copy.estimated_price = (parseFloat(copy.estimated_price) * DRIVER_COMMISSION_RATE).toFixed(2);
  }
  if (copy.final_price != null) {
    copy.final_price = (parseFloat(copy.final_price) * DRIVER_COMMISSION_RATE).toFixed(2);
  }
  // Also apply to pricing_json if present
  if (copy.pricing_json) {
    try {
      const pricing = typeof copy.pricing_json === 'string' ? JSON.parse(copy.pricing_json) : { ...copy.pricing_json };
      if (pricing.total != null) pricing.total = (parseFloat(pricing.total) * DRIVER_COMMISSION_RATE).toFixed(2);
      if (pricing.estimatedTotal != null) pricing.estimatedTotal = (parseFloat(pricing.estimatedTotal) * DRIVER_COMMISSION_RATE).toFixed(2);
      copy.pricing_json = typeof order.pricing_json === 'string' ? JSON.stringify(pricing) : pricing;
    } catch (e) {
      // ignore parse errors
    }
  }
  return copy;
}

function applyDriverCommissionToList(orders: any[]): any[] {
  return orders.map(applyDriverCommission);
}

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

// ============================================================================
// AUTO-CANCEL OVERDUE ORDERS CRON (runs every 5 minutes, acts at 9PM ET)
// Orders not completed by 9PM are unassigned and rescheduled to tomorrow
// ============================================================================
let cronStarted = false;
function startOverdueCron() {
  if (cronStarted) return;
  cronStarted = true;

  // Check every 5 minutes
  setInterval(async () => {
    try {
      const pool = await getPgPool();
      if (!pool) return;

      // Current time in US Eastern (ET)
      const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const hour = nowET.getHours();

      // Only act between 9PM and midnight ET
      if (hour < 21) return;

      // Find overdue orders: assigned to a driver, not completed, scheduled_for <= today
      const todayStr = nowET.toISOString().split('T')[0]; // YYYY-MM-DD
      const tomorrowDate = new Date(nowET);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT id, assigned_driver_id, scheduled_for FROM jobs
         WHERE assigned_driver_id IS NOT NULL
           AND status IN ('accepted', 'assigned', 'en_route', 'arrived', 'in_progress', 'scheduled')
           AND (scheduled_for::date <= $1::date OR scheduled_for IS NULL)`,
        [todayStr]
      );

      if (result.rows.length > 0) {
        console.log(`[Cron] Found ${result.rows.length} overdue orders to unassign`);
        for (const row of result.rows) {
          await pool.query(
            `UPDATE jobs SET status = 'pending', assigned_driver_id = NULL,
                    scheduled_for = ($1::date + TIME '04:00:00'),
                    updated_at = NOW()
             WHERE id = $2`,
            [tomorrowStr, row.id]
          );
          console.log(`[Cron] Unassigned order ${row.id}, rescheduled to ${tomorrowStr}`);
        }
      }
    } catch (e) {
      console.error('[Cron] Overdue check error:', e);
    }
  }, 5 * 60 * 1000); // every 5 minutes

  console.log('[Cron] Overdue order auto-cancel started (checks every 5min, acts at 9PM ET)');
}

export function registerDriverAuthRoutes(app: Express) {

  // Start the overdue cron job
  startOverdueCron();

  // POST /admin/orders/process-overdue - Manual trigger for overdue check (admin only)
  app.post('/admin/orders/process-overdue', async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const tomorrowDate = new Date(now);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

      const result = await pool.query(
        `SELECT id, assigned_driver_id, scheduled_for, status FROM jobs
         WHERE assigned_driver_id IS NOT NULL
           AND status IN ('accepted', 'assigned', 'en_route', 'arrived', 'in_progress', 'scheduled')
           AND (scheduled_for::date < $1::date OR scheduled_for IS NULL)`,
        [todayStr]
      );

      const processed = [];
      for (const row of result.rows) {
        await pool.query(
          `UPDATE jobs SET status = 'pending', assigned_driver_id = NULL,
                  scheduled_for = ($1::date + TIME '04:00:00'),
                  updated_at = NOW()
           WHERE id = $2`,
          [tomorrowStr, row.id]
        );
        processed.push({ id: row.id, old_status: row.status, new_scheduled: tomorrowStr });
      }

      res.json({ success: true, processed: processed.length, orders: processed });
    } catch (err: any) {
      console.error('Process overdue error:', err);
      res.status(500).json({ error: 'Failed to process overdue orders' });
    }
  });

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
          ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS driver_status TEXT DEFAULT 'pending_review',
          ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
          ADD COLUMN IF NOT EXISTS selfie_url TEXT,
          ADD COLUMN IF NOT EXISTS license_url TEXT,
          ADD COLUMN IF NOT EXISTS vehicle_registration_url TEXT,
          ADD COLUMN IF NOT EXISTS insurance_url TEXT,
          ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
          ADD COLUMN IF NOT EXISTS suspension_reason TEXT
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

        // Ensure pickup_time_window column exists on jobs table
        try {
          await pool.query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS pickup_time_window TEXT`);
          console.log('[DriverAuth] pickup_time_window column ensured');
        } catch (e) {
          console.warn('[DriverAuth] Could not add pickup_time_window column:', (e as any)?.message);
        }

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
            scheduled_for as pickup_date, pickup_time_window,
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
        'SELECT id, status, first_name, last_name, vehicle_type, driver_status, is_active, rejection_reason FROM drivers WHERE email = $1 LIMIT 1',
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
          driverStatus: driver.driver_status || 'pending_review',
          isActive: driver.is_active !== false,
          firstName: driver.first_name,
          lastName: driver.last_name,
          vehicleType: driver.vehicle_type,
          rejectionReason: driver.rejection_reason
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

  // POST /driver/documents - Upload document URLs (selfie, license, vehicle_registration, insurance)
  app.post('/driver/documents', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: 'Database not available' });
      }

      const { selfieUrl, licenseUrl, vehicleRegistrationUrl, insuranceUrl } = req.body;

      const updates: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (selfieUrl !== undefined) { updates.push(`selfie_url = $${idx++}`); values.push(selfieUrl); }
      if (licenseUrl !== undefined) { updates.push(`license_url = $${idx++}`); values.push(licenseUrl); }
      if (vehicleRegistrationUrl !== undefined) { updates.push(`vehicle_registration_url = $${idx++}`); values.push(vehicleRegistrationUrl); }
      if (insuranceUrl !== undefined) { updates.push(`insurance_url = $${idx++}`); values.push(insuranceUrl); }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No document URLs provided' });
      }

      // Also set driver_status to pending_review so admin knows to review
      updates.push(`driver_status = COALESCE(NULLIF(driver_status, 'approved'), 'pending_review')`);
      updates.push(`updated_at = NOW()`);
      values.push(decoded.driverId);

      await pool.query(
        `UPDATE drivers SET ${updates.join(', ')} WHERE id = $${idx}`,
        values
      );

      // Check if all 4 docs are now uploaded
      const checkResult = await pool.query(
        `SELECT selfie_url, license_url, vehicle_registration_url, insurance_url, driver_status FROM drivers WHERE id = $1`,
        [decoded.driverId]
      );
      const driver = checkResult.rows[0];
      const allUploaded = driver && driver.selfie_url && driver.license_url && driver.vehicle_registration_url && driver.insurance_url;

      res.json({ success: true, message: 'Documents saved successfully', allUploaded: !!allUploaded });
    } catch (err: any) {
      console.error('Document upload error:', err);
      res.status(500).json({ error: 'Failed to save documents' });
    }
  });

  // POST /driver/online - Toggle online/offline status (only if approved)
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

      // Check if driver is approved before allowing to go online
      if (online) {
        const driverCheck = await pool.query(
          'SELECT driver_status, is_active FROM drivers WHERE id = $1',
          [decoded.driverId]
        );
        const driverData = driverCheck.rows[0];
        if (driverData && driverData.driver_status !== 'approved') {
          return res.status(403).json({ 
            error: 'Your account is not yet approved. Please wait for admin approval before going online.',
            driverStatus: driverData.driver_status || 'pending_review'
          });
        }
        if (driverData && driverData.is_active === false) {
          return res.status(403).json({ 
            error: 'Your account has been suspended. Please contact support.',
            driverStatus: 'suspended'
          });
        }
      }

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
  // Queries BOTH jobs table and orders table to include web-created orders
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

      // Get pending orders from jobs table (primary)
      const jobsResult = await pool.query(
        `SELECT id, customer_name, customer_phone, customer_email, service_type, status,
                pickup_address, pickup_lat, pickup_lng, description, estimated_price,
                items_json, scheduled_for, pickup_time_window, photo_urls, created_at
         FROM jobs WHERE status IN ('pending', 'dispatching') AND assigned_driver_id IS NULL
         ORDER BY created_at DESC LIMIT 20`
      );

      // Also check orders table for any pending orders (legacy/web compat)
      let ordersRows: any[] = [];
      try {
        const ordersResult = await pool.query(
          `SELECT id::text, customer_name, phone as customer_phone, email as customer_email,
                  service_type, status, street as pickup_address,
                  lat::double precision as pickup_lat, lng::double precision as pickup_lng,
                  '' as description,
                  COALESCE((pricing_json::jsonb->>'total')::numeric, 0) as estimated_price,
                  items_json::text, pickup_date as scheduled_for, created_at
           FROM orders WHERE status IN ('pending', 'dispatching') AND assigned_driver_id IS NULL
           ORDER BY created_at DESC LIMIT 20`
        );
        ordersRows = ordersResult.rows || [];
      } catch (e) {
        // orders table may not exist or have different schema
        console.warn('[DriverAuth] Could not query orders table:', (e as any)?.message);
      }

      const allOrders = [...(jobsResult.rows || []), ...ordersRows];
      // Sort by created_at descending
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log('[DriverAuth] GET /driver/orders/available - jobs:' + jobsResult.rows.length + ' orders:' + ordersRows.length + ' total:' + allOrders.length);

      res.json({ orders: applyDriverCommissionToList(allOrders) });
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
          driverStatus: driver.driver_status || 'pending_review',
          isActive: driver.is_active !== false,
          vehicleType: driver.vehicle_type,
          vehicleCapacity: driver.vehicle_capacity,
          isOnline: driver.is_online,
          selfieUrl: driver.selfie_url,
          licenseUrl: driver.license_url,
          vehicleRegistrationUrl: driver.vehicle_registration_url,
          insuranceUrl: driver.insurance_url,
          rejectionReason: driver.rejection_reason,
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

  // GET /driver/orders/history - Get order history (ONLY completed orders)
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
           WHERE ja.driver_id = $1 AND j.status = 'completed'
           ORDER BY j.updated_at DESC LIMIT 50`,
          [decoded.driverId]
        );
        res.json({ orders: applyDriverCommissionToList(result.rows || []) });
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
      
      // Fetch order to calculate earnings
      const orderResult = await pool.query(
        "SELECT estimated_price, price_total_cents FROM jobs WHERE id = $1",
        [orderId]
      );
      
      let priceTotalCents = 0;
      if (orderResult.rows.length > 0) {
        const row = orderResult.rows[0];
        // Use price_total_cents if already set (from Stripe payment), otherwise calculate from estimated_price
        if (row.price_total_cents && row.price_total_cents > 0) {
          priceTotalCents = parseInt(row.price_total_cents);
        } else if (row.estimated_price) {
          priceTotalCents = Math.round(parseFloat(row.estimated_price) * 100);
        }
      }
      
      // Calculate 70/30 split
      const platformFeeCents = Math.round(priceTotalCents * 0.30);
      const driverEarningsCents = priceTotalCents - platformFeeCents;
      
      await pool.query(
        `UPDATE jobs SET 
          status = 'completed', 
          completed_at = NOW(), 
          updated_at = NOW(),
          price_total_cents = COALESCE(NULLIF(price_total_cents, 0), $2),
          platform_fee_cents = COALESCE(NULLIF(platform_fee_cents, 0), $3),
          driver_earnings_cents = COALESCE(NULLIF(driver_earnings_cents, 0), $4),
          payout_status = COALESCE(NULLIF(payout_status, ''), 'eligible')
        WHERE id = $1`,
        [orderId, priceTotalCents, platformFeeCents, driverEarningsCents]
      );

      console.log(`[DriverAuth] Order ${orderId} completed: total=${priceTotalCents}c, platform=${platformFeeCents}c, driver=${driverEarningsCents}c`);

      res.json({ success: true, message: 'Order completed', earnings: { priceTotalCents, platformFeeCents, driverEarningsCents } });
    } catch (err: any) {
      console.error('Complete order error:', err);
      res.status(500).json({ error: 'Failed to complete order' });
    }
  });

  // POST /driver/orders/:id/start-trip - Driver starts driving to pickup
  app.post('/driver/orders/:id/start-trip', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });
      await pool.query(
        "UPDATE jobs SET status = 'en_route', updated_at = NOW() WHERE id = $1 AND assigned_driver_id = $2",
        [req.params.id, decoded.driverId]
      );
      res.json({ success: true, message: 'Trip started - en route to pickup' });
    } catch (err: any) {
      console.error('Start trip error:', err);
      res.status(500).json({ error: 'Failed to start trip' });
    }
  });

  // POST /driver/orders/:id/arrived - Driver arrived at pickup location
  app.post('/driver/orders/:id/arrived', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });
      await pool.query(
        "UPDATE jobs SET status = 'arrived', updated_at = NOW() WHERE id = $1 AND assigned_driver_id = $2",
        [req.params.id, decoded.driverId]
      );
      res.json({ success: true, message: 'Arrived at pickup location' });
    } catch (err: any) {
      console.error('Arrived error:', err);
      res.status(500).json({ error: 'Failed to update arrival' });
    }
  });

  // POST /driver/orders/:id/start-work - Driver starts the actual work
  app.post('/driver/orders/:id/start-work', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });
      await pool.query(
        "UPDATE jobs SET status = 'in_progress', updated_at = NOW() WHERE id = $1 AND assigned_driver_id = $2",
        [req.params.id, decoded.driverId]
      );
      res.json({ success: true, message: 'Work started' });
    } catch (err: any) {
      console.error('Start work error:', err);
      res.status(500).json({ error: 'Failed to start work' });
    }
  });

  // POST /driver/orders/:id/upload-photo - Upload completion photo
  app.post('/driver/orders/:id/upload-photo', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });
      const { photo_base64 } = req.body;
      // Store completion photo in DB and update status
      // Append to existing photos (JSON array of base64 strings)
      await pool.query(
        `UPDATE jobs SET 
          status = 'photo_taken', 
          completion_photos = CASE 
            WHEN completion_photos IS NULL OR completion_photos = '' THEN $3
            ELSE completion_photos || '|||' || $3
          END,
          updated_at = NOW() 
        WHERE id = $1 AND assigned_driver_id = $2`,
        [req.params.id, decoded.driverId, photo_base64 || '']
      );
      res.json({ success: true, message: 'Photo uploaded' });
    } catch (err: any) {
      console.error('Upload photo error:', err);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  });

  // POST /driver/orders/:id/signature - Customer signature captured
  app.post('/driver/orders/:id/signature', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });
      const { signature_base64 } = req.body;
      // Store signature data in DB and update status
      await pool.query(
        "UPDATE jobs SET status = 'signed', signature_data = $3, updated_at = NOW() WHERE id = $1 AND assigned_driver_id = $2",
        [req.params.id, decoded.driverId, signature_base64 || '']
      );
      res.json({ success: true, message: 'Signature captured' });
    } catch (err: any) {
      console.error('Signature error:', err);
      res.status(500).json({ error: 'Failed to capture signature' });
    }
  });

  // GET /driver/orders/my-orders - Get orders assigned to this driver
  app.get('/driver/orders/my-orders', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      // Get orders assigned to this driver (not completed/cancelled)
      const jobsResult = await pool.query(
        `SELECT id, customer_name, customer_phone, customer_email, service_type, status,
                pickup_address, pickup_lat, pickup_lng, description, estimated_price,
                items_json, scheduled_for, pickup_time_window, photo_urls, created_at
         FROM jobs
         WHERE assigned_driver_id = $1
           AND status NOT IN ('completed', 'cancelled')
         ORDER BY scheduled_for ASC NULLS LAST, created_at DESC`,
        [decoded.driverId]
      );

      // Also check orders table for legacy assignments
      let ordersRows: any[] = [];
      try {
        const ordersResult = await pool.query(
          `SELECT id::text, customer_name, phone as customer_phone, email as customer_email,
                  service_type, status, street as pickup_address,
                  lat::double precision as pickup_lat, lng::double precision as pickup_lng,
                  '' as description,
                  COALESCE((pricing_json::jsonb->>'total')::numeric, 0) as estimated_price,
                  items_json::text, pickup_date as scheduled_for, created_at
           FROM orders
           WHERE assigned_driver_id = $1
             AND status NOT IN ('completed', 'cancelled')
           ORDER BY pickup_date ASC NULLS LAST, created_at DESC`,
          [decoded.driverId]
        );
        ordersRows = ordersResult.rows || [];
      } catch (e) {
        console.warn('[DriverAuth] Could not query orders table for my-orders:', (e as any)?.message);
      }

      const allOrders = [...(jobsResult.rows || []), ...ordersRows];
      console.log('[DriverAuth] GET /driver/orders/my-orders - jobs:' + jobsResult.rows.length + ' orders:' + ordersRows.length);

      res.json({ orders: applyDriverCommissionToList(allOrders) });
    } catch (err: any) {
      console.error('My orders error:', err);
      res.json({ orders: [] });
    }
  });

  // GET /driver/orders/:id - Get single order details
  app.get('/driver/orders/:id', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });
      const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
      res.json({ order: applyDriverCommission(result.rows[0]) });
    } catch (err: any) {
      console.error('Get order error:', err);
      res.status(500).json({ error: 'Failed to get order' });
    }
  });

  // POST /api/setup/admin - Create admin user (one-time setup)
  app.post('/api/setup/admin', async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'No DB' });
      
      // Ensure users table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT,
          role TEXT DEFAULT 'admin',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `);
      
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      const hash = await bcrypt.hash(password, 10);
      
      if (existing.rows.length > 0) {
        await pool.query('UPDATE users SET password_hash = $1, name = $2 WHERE email = $3', [hash, name || 'Admin', email]);
        return res.json({ success: true, message: 'Admin user updated' });
      }
      
      await pool.query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
        [email, hash, name || 'Admin', 'admin']
      );
      res.json({ success: true, message: 'Admin user created' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /driver/orders/:id/cancel - Cancel order
  app.post('/driver/orders/:id/cancel', async (req, res) => {
    try {
      const decoded = verifyToken(req);
      if (!decoded) return res.status(401).json({ error: 'Unauthorized' });
      
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });
      
      const orderId = req.params.id;
      
      // Update job status to cancelled
      await pool.query(
        "UPDATE jobs SET status = 'pending', assigned_driver_id = NULL, updated_at = NOW() WHERE id = $1",
        [orderId]
      );
      
      res.json({ success: true, message: 'Order cancelled and returned to available orders' });
    } catch (err: any) {
      console.error('Cancel order error:', err);
      res.status(500).json({ error: 'Failed to cancel order' });
    }
  });
}
