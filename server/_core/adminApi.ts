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
      
      let query = 'SELECT * FROM drivers WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
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
               assigned_driver_id::text, created_at, updated_at
        FROM orders
        UNION ALL
        SELECT id::text, service_type, customer_name, customer_phone as phone, customer_email as email,
               pickup_address as street, '' as city, '' as state, '' as zip,
               pickup_lat::double precision as lat, pickup_lng::double precision as lng,
               scheduled_for::text as pickup_date, '' as pickup_time_window,
               COALESCE(items_json::text, '[]') as items_json, json_build_object('total', COALESCE(estimated_price, '0'))::text as pricing_json,
               status, assigned_driver_id::text, created_at, updated_at
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

      const result = await pool.query(
        'UPDATE orders SET assigned_driver_id = $1, status = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        [driver_id, 'assigned', req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({ order: result.rows[0] });
    } catch (err: any) {
      console.error('Assign order error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
