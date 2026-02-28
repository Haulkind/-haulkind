import { Express } from "express";
import { requireAdmin } from "./adminAuth";

let pgPool: any = null;

async function getPgPool() {
  if (pgPool) return pgPool;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  
  try {
    const { default: pg } = await import("pg");
    pgPool = new pg.Pool({ 
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
    return pgPool;
  } catch (e) {
    console.error('[AdminAPI] Failed to connect to PostgreSQL:', e);
    return null;
  }
}

export function registerAdminApiRoutes(app: Express) {
  // ============================================================================
  // STATS
  // ============================================================================
  
  app.get('/admin/stats/overview', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      // Get driver counts by status
      const driversResult = await pool.query(`
        SELECT status, COUNT(*) as count 
        FROM drivers 
        GROUP BY status
      `);
      const driverStats = driversResult.rows.reduce((acc: any, row: any) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {});

      // Get total customers
      const customersResult = await pool.query('SELECT COUNT(*) as count FROM customers');
      const totalCustomers = parseInt(customersResult.rows[0]?.count || 0);

      // Get order counts by status (from both orders and jobs tables)
      const ordersResult = await pool.query(`
        SELECT status, COUNT(*) as count FROM (
          SELECT status FROM orders
          UNION ALL
          SELECT status FROM jobs
        ) combined
        GROUP BY status
      `);
      const orderStats = ordersResult.rows.reduce((acc: any, row: any) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {});

      // Get recent orders count (last 24h, 7d, 30d) from both tables
      const today = await pool.query(`SELECT COUNT(*) as count FROM (
        SELECT created_at FROM orders WHERE created_at >= NOW() - INTERVAL '1 day'
        UNION ALL
        SELECT created_at FROM jobs WHERE created_at >= NOW() - INTERVAL '1 day'
      ) combined`);
      const thisWeek = await pool.query(`SELECT COUNT(*) as count FROM (
        SELECT created_at FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'
        UNION ALL
        SELECT created_at FROM jobs WHERE created_at >= NOW() - INTERVAL '7 days'
      ) combined`);
      const thisMonth = await pool.query(`SELECT COUNT(*) as count FROM (
        SELECT created_at FROM orders WHERE created_at >= NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT created_at FROM jobs WHERE created_at >= NOW() - INTERVAL '30 days'
      ) combined`);

      res.json({
        drivers: {
          total: Object.values(driverStats).reduce((sum: number, val: any) => sum + val, 0),
          pending: driverStats.pending || 0,
          approved: driverStats.approved || 0,
          blocked: driverStats.blocked || 0,
        },
        customers: {
          total: totalCustomers,
        },
        orders: {
          total: Object.values(orderStats).reduce((sum: number, val: any) => sum + val, 0),
          today: parseInt(today.rows[0]?.count || 0),
          thisWeek: parseInt(thisWeek.rows[0]?.count || 0),
          thisMonth: parseInt(thisMonth.rows[0]?.count || 0),
          byStatus: orderStats,
        },
      });
    } catch (err: any) {
      console.error('Get stats error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============================================================================
  // DRIVERS
  // ============================================================================
  
  app.get('/admin/drivers', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { status, search, limit = 50, offset = 0 } = req.query;
      
      let query = 'SELECT id, name, phone, email, status, created_at, updated_at, first_name, last_name, address, city, state, zip_code, vehicle_type, vehicle_capacity, lifting_limit, license_plate, services, is_online, driver_status, is_active, selfie_url, license_url, vehicle_registration_url, insurance_url, rejection_reason, suspension_reason FROM drivers WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND (status = $${paramIndex} OR driver_status = $${paramIndex})`;
        paramIndex++;
        params.push(status);
      }

      if (search) {
        query += ` AND (name ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++} OR phone ILIKE $${paramIndex++})`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) as count FROM drivers WHERE 1=1';
      const countParams: any[] = [];
      let countParamIndex = 1;
      
      if (status) {
        countQuery += ` AND status = $${countParamIndex++}`;
        countParams.push(status);
      }
      
      if (search) {
        countQuery += ` AND (name ILIKE $${countParamIndex++} OR email ILIKE $${countParamIndex++} OR phone ILIKE $${countParamIndex++})`;
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0]?.count || 0);

      res.json({ drivers: result.rows, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
    } catch (err: any) {
      console.error('Get drivers error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/admin/drivers/:id', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      res.json({ driver: result.rows[0] });
    } catch (err: any) {
      console.error('Get driver error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/admin/drivers/:id/status', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { status } = req.body;
      if (!['pending', 'approved', 'blocked'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const result = await pool.query(
        'UPDATE drivers SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [status, req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      res.json({ driver: result.rows[0] });
    } catch (err: any) {
      console.error('Update driver status error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /admin/drivers/:id/approve - Approve a driver
  app.post('/admin/drivers/:id/approve', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const result = await pool.query(
        `UPDATE drivers SET driver_status = 'approved', is_active = true, status = 'approved', rejection_reason = NULL, suspension_reason = NULL, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      console.log(`[Admin] Driver ${req.params.id} APPROVED`);
      res.json({ driver: result.rows[0] });
    } catch (err: any) {
      console.error('Approve driver error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /admin/drivers/:id/reject - Reject a driver
  app.post('/admin/drivers/:id/reject', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { reason } = req.body;
      const result = await pool.query(
        `UPDATE drivers SET driver_status = 'rejected', status = 'blocked', rejection_reason = $1, is_active = false, is_online = false, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [reason || 'Documents not approved', req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      console.log(`[Admin] Driver ${req.params.id} REJECTED: ${reason}`);
      res.json({ driver: result.rows[0] });
    } catch (err: any) {
      console.error('Reject driver error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /admin/drivers/:id/suspend - Suspend a driver
  app.post('/admin/drivers/:id/suspend', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { reason } = req.body;
      const result = await pool.query(
        `UPDATE drivers SET driver_status = 'suspended', is_active = false, is_online = false, suspension_reason = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [reason || 'Account suspended', req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      console.log(`[Admin] Driver ${req.params.id} SUSPENDED: ${reason}`);
      res.json({ driver: result.rows[0] });
    } catch (err: any) {
      console.error('Suspend driver error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /admin/drivers/:id/activate - Reactivate a driver
  app.post('/admin/drivers/:id/activate', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const result = await pool.query(
        `UPDATE drivers SET driver_status = 'approved', is_active = true, suspension_reason = NULL, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      console.log(`[Admin] Driver ${req.params.id} ACTIVATED`);
      res.json({ driver: result.rows[0] });
    } catch (err: any) {
      console.error('Activate driver error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============================================================================
  // CUSTOMERS
  // ============================================================================
  
  app.get('/admin/customers', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { search, limit = 50, offset = 0 } = req.query;
      
      // Join customers with users to get full info
      let query = `
        SELECT c.id, c.user_id, u.name, u.email, u.phone,
               COUNT(o.id) as total_orders
        FROM customers c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN orders o ON o.email = u.email
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND (u.name ILIKE $${paramIndex++} OR u.email ILIKE $${paramIndex++})`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }

      query += ` GROUP BY c.id, c.user_id, u.name, u.email, u.phone ORDER BY c.id DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      // Get total count
      const countResult = await pool.query('SELECT COUNT(*) as count FROM customers');
      const total = parseInt(countResult.rows[0]?.count || 0);

      res.json({ customers: result.rows, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
    } catch (err: any) {
      console.error('Get customers error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/admin/customers/:id', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const result = await pool.query(`
        SELECT c.id, c.user_id, u.name, u.email, u.phone
        FROM customers c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = $1
      `, [req.params.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      res.json({ customer: result.rows[0] });
    } catch (err: any) {
      console.error('Get customer error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============================================================================
  // ORDERS
  // ============================================================================
  
  app.get('/admin/orders', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { status, service_type, search, limit = 50, offset = 0 } = req.query;
      
      // Query from BOTH orders (legacy) and jobs (new) tables using UNION ALL
      // Normalize field names so the admin dashboard gets consistent data
      let baseQuery = `
        SELECT id::text, service_type, customer_name, phone, email,
               street, city, state, zip, lat::double precision, lng::double precision,
               pickup_date::text, pickup_time_window::text,
               items_json::text, pricing_json::text, status,
               assigned_driver_id::text, created_at, updated_at,
               CAST(NULL AS boolean) as has_completion_photos, CAST(NULL AS boolean) as has_signature, CAST(NULL AS boolean) as has_photo_urls
        FROM orders
        UNION ALL
        SELECT id::text, service_type, customer_name, customer_phone as phone, customer_email as email,
               pickup_address as street, '' as city, '' as state, '' as zip,
               pickup_lat::double precision as lat, pickup_lng::double precision as lng,
               scheduled_for::text as pickup_date, '' as pickup_time_window,
               COALESCE(items_json::text, '[]') as items_json, json_build_object('total', COALESCE(estimated_price, '0'))::text as pricing_json,
               status, assigned_driver_id::text, created_at, updated_at,
               (completion_photos IS NOT NULL AND completion_photos != '') as has_completion_photos,
               (signature_data IS NOT NULL AND signature_data != '') as has_signature,
               (photo_urls IS NOT NULL AND photo_urls != '') as has_photo_urls
        FROM jobs
      `;
      
      let query = `SELECT * FROM (${baseQuery}) combined WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }

      if (service_type) {
        query += ` AND service_type = $${paramIndex++}`;
        params.push(service_type);
      }

      if (search) {
        query += ` AND (customer_name ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++} OR phone ILIKE $${paramIndex++})`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      // Get total count from both tables
      let countQuery = `SELECT COUNT(*) as count FROM (${baseQuery}) combined WHERE 1=1`;
      const countParams: any[] = [];
      let countParamIndex = 1;
      
      if (status) {
        countQuery += ` AND status = $${countParamIndex++}`;
        countParams.push(status);
      }
      
      if (service_type) {
        countQuery += ` AND service_type = $${countParamIndex++}`;
        countParams.push(service_type);
      }
      
      if (search) {
        countQuery += ` AND (customer_name ILIKE $${countParamIndex++} OR email ILIKE $${countParamIndex++} OR phone ILIKE $${countParamIndex++})`;
        const searchPattern = `%${search}%`;
        countParams.push(searchPattern, searchPattern, searchPattern);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0]?.count || 0);

      res.json({ orders: result.rows, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
    } catch (err: any) {
      console.error('Get orders error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/admin/orders/:id', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      // Try both tables
      let result = await pool.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) {
        result = await pool.query('SELECT * FROM orders WHERE id::text = $1', [req.params.id]);
      }
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ order: result.rows[0] });
    } catch (err: any) {
      console.error('Get order error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /admin/orders/:id/media - Fetch completion photos and signature on-demand
  app.get('/admin/orders/:id/media', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      // Only jobs table has media columns
      const result = await pool.query(
        'SELECT completion_photos, signature_data, photo_urls FROM jobs WHERE id = $1',
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.json({ completion_photos: null, signature_data: null, photo_urls: null });
      }

      res.json(result.rows[0]);
    } catch (err: any) {
      console.error('Get order media error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/admin/orders/:id/assign', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { driver_id } = req.body;
      if (!driver_id) {
        return res.status(400).json({ error: 'driver_id is required' });
      }

      // Verify driver exists
      const driverCheck = await pool.query('SELECT id FROM drivers WHERE id = $1', [driver_id]);
      if (driverCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      // Try jobs table first (primary), then orders table (legacy)
      let result = await pool.query(
        'UPDATE jobs SET assigned_driver_id = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [driver_id, 'assigned', req.params.id]
      );

      if (result.rows.length === 0) {
        result = await pool.query(
          'UPDATE orders SET assigned_driver_id = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
          [driver_id, 'assigned', req.params.id]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Also create job_assignments record
      try {
        await pool.query(
          'INSERT INTO job_assignments (job_id, driver_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.params.id, driver_id]
        );
      } catch (e) {
        // ignore if assignment already exists
      }

      res.json({ order: result.rows[0] });
    } catch (err: any) {
      console.error('Assign order error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /admin/orders/:id/cancel - Cancel an order
  app.put('/admin/orders/:id/cancel', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      // Try jobs table first (primary), then orders table (legacy)
      let result = await pool.query(
        `UPDATE jobs SET status = 'cancelled', assigned_driver_id = NULL, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        result = await pool.query(
          `UPDATE orders SET status = 'cancelled', assigned_driver_id = NULL, updated_at = NOW() WHERE id::text = $1 RETURNING *`,
          [req.params.id]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Remove job_assignments for this order
      try {
        await pool.query('DELETE FROM job_assignments WHERE job_id = $1', [req.params.id]);
      } catch (e) {
        // ignore if table doesn't exist or no records
      }

      console.log(`[Admin] Order ${req.params.id} CANCELLED`);
      res.json({ order: result.rows[0] });
    } catch (err: any) {
      console.error('Cancel order error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /admin/orders/:id/reschedule - Change date/time of an order
  app.put('/admin/orders/:id/reschedule', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { pickup_date, pickup_time_window } = req.body;
      if (!pickup_date) {
        return res.status(400).json({ error: 'pickup_date is required' });
      }

      // Try jobs table first (primary) — uses scheduled_for field
      let result = await pool.query(
        `UPDATE jobs SET scheduled_for = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [pickup_date, req.params.id]
      );

      if (result.rows.length === 0) {
        // Try orders table (legacy) — uses pickup_date and pickup_time_window fields
        const updateFields = ['pickup_date = $1', 'updated_at = NOW()'];
        const params: any[] = [pickup_date];
        let paramIndex = 2;

        if (pickup_time_window) {
          updateFields.push(`pickup_time_window = $${paramIndex++}`);
          params.push(pickup_time_window);
        }

        params.push(req.params.id);
        result = await pool.query(
          `UPDATE orders SET ${updateFields.join(', ')} WHERE id::text = $${paramIndex} RETURNING *`,
          params
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log(`[Admin] Order ${req.params.id} RESCHEDULED to ${pickup_date} ${pickup_time_window || ''}`);
      res.json({ order: result.rows[0] });
    } catch (err: any) {
      console.error('Reschedule order error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
