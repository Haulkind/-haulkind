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

      // Get order counts by status from jobs table (primary source)
      // Note: 'orders' may be a VIEW on 'jobs', querying both causes double-counting
      const ordersResult = await pool.query(`
        SELECT status, COUNT(*) as count FROM jobs
        GROUP BY status
      `);
      const orderStats = ordersResult.rows.reduce((acc: any, row: any) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {});

      // Get recent orders count (last 24h, 7d, 30d) from jobs table
      const today = await pool.query(`SELECT COUNT(*) as count FROM jobs WHERE created_at >= NOW() - INTERVAL '1 day'`);
      const thisWeek = await pool.query(`SELECT COUNT(*) as count FROM jobs WHERE created_at >= NOW() - INTERVAL '7 days'`);
      const thisMonth = await pool.query(`SELECT COUNT(*) as count FROM jobs WHERE created_at >= NOW() - INTERVAL '30 days'`);

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

  // ============================================================================
  // DRIVER LOCATIONS (admin) - Get all drivers with their latest GPS location
  // IMPORTANT: This route MUST be registered BEFORE /admin/drivers/:id
  // otherwise Express matches "locations" as :id parameter and the request
  // never reaches this handler (causing the persistent 500 error).
  // ============================================================================
  app.get('/admin/drivers/locations', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      // Step 1: Get approved drivers using explicit column list (same as /admin/drivers)
      let driversRows: any[] = [];
      try {
        const driversResult = await pool.query(
          `SELECT id, name, phone, email, status, first_name, last_name,
                  vehicle_type, is_online, driver_status, is_active
           FROM drivers WHERE status = 'approved' ORDER BY created_at DESC`
        );
        driversRows = driversResult.rows;
        console.log(`[Admin] Step 1: ${driversRows.length} approved drivers found`);
      } catch (e: any) {
        console.error('[Admin] Step 1 failed (drivers query):', e?.message || String(e));
        // Fallback: try simpler query
        try {
          const fallback = await pool.query(`SELECT id, name, phone, email, status FROM drivers WHERE status = 'approved'`);
          driversRows = fallback.rows;
          console.log(`[Admin] Step 1 fallback: ${driversRows.length} drivers`);
        } catch (e2: any) {
          console.error('[Admin] Step 1 fallback also failed:', e2?.message || String(e2));
          return res.status(500).json({ error: 'Failed to query drivers', details: e2?.message || String(e2) });
        }
      }

      // Step 2: Get locations from driver_locations table
      const locationMap = new Map<string, any>();
      try {
        // Check if table exists first
        const tableCheck = await pool.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'driver_locations') as exists`
        );
        if (tableCheck.rows[0]?.exists) {
          const locResult = await pool.query(
            `SELECT driver_id, lat, lng, heading, speed, updated_at as location_updated_at
             FROM driver_locations`
          );
          for (const row of locResult.rows) {
            locationMap.set(String(row.driver_id), {
              lat: row.lat != null ? parseFloat(String(row.lat)) : null,
              lng: row.lng != null ? parseFloat(String(row.lng)) : null,
              heading: row.heading != null ? parseFloat(String(row.heading)) : null,
              speed: row.speed != null ? parseFloat(String(row.speed)) : null,
              location_updated_at: row.location_updated_at,
            });
          }
          console.log(`[Admin] Step 2: ${locResult.rows.length} location rows, keys: [${Array.from(locationMap.keys()).join(', ')}]`);
        } else {
          console.log('[Admin] Step 2: driver_locations table does not exist yet');
        }
      } catch (locErr: any) {
        console.warn('[Admin] Step 2 warning (locations query):', locErr?.message || String(locErr));
        // Continue without locations — drivers will show as "No GPS"
      }

      // Step 3: Merge drivers with their locations
      const drivers = driversRows.map((d: any) => {
        const loc = locationMap.get(String(d.id));
        let displayName = 'Unknown';
        try {
          displayName = (d.first_name && d.last_name)
            ? `${d.first_name} ${d.last_name}`
            : d.name || 'Unknown';
        } catch (_e) { /* safe fallback */ }
        return {
          id: d.id,
          name: d.name || null,
          display_name: displayName,
          phone: d.phone || null,
          email: d.email || null,
          status: d.status || null,
          driver_status: d.driver_status || d.status || null,
          is_online: d.is_online || false,
          vehicle_type: d.vehicle_type || null,
          lat: loc?.lat ?? null,
          lng: loc?.lng ?? null,
          heading: loc?.heading ?? null,
          speed: loc?.speed ?? null,
          location_updated_at: loc?.location_updated_at ?? null,
        };
      });

      console.log(`[Admin] GET /admin/drivers/locations - ${drivers.length} drivers, ${locationMap.size} with GPS`);
      res.json({ drivers });
    } catch (err: any) {
      console.error('Get driver locations error:', err);
      res.status(500).json({ error: 'Internal server error', details: err?.message || String(err) });
    }
  });

  // PUT /admin/drivers/:id/edit - Edit driver information
  app.put('/admin/drivers/:id/edit', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { name, email, phone, vehicle_type } = req.body;
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        fields.push(`name = $${paramIndex++}`);
        values.push(name);
        // Also update first_name and last_name so the name change reflects everywhere
        // (orders query uses COALESCE(first_name || ' ' || last_name, name))
        const nameParts = name.trim().split(/\s+/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        fields.push(`first_name = $${paramIndex++}`);
        values.push(firstName);
        fields.push(`last_name = $${paramIndex++}`);
        values.push(lastName);
      }
      if (email !== undefined) {
        fields.push(`email = $${paramIndex++}`);
        values.push(email);
      }
      if (phone !== undefined) {
        fields.push(`phone = $${paramIndex++}`);
        values.push(phone);
      }
      if (vehicle_type !== undefined) {
        fields.push(`vehicle_type = $${paramIndex++}`);
        values.push(vehicle_type);
      }

      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      fields.push(`updated_at = NOW()`);
      values.push(req.params.id);

      const result = await pool.query(
        `UPDATE drivers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      console.log(`[Admin] Driver ${req.params.id} EDITED: ${fields.join(', ')}`);
      res.json({ driver: result.rows[0] });
    } catch (err: any) {
      console.error('Edit driver error:', err);
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
      
      // Check if customer_accounts table exists
      const tableCheck = await pool.query(`
        SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_accounts') as exists
      `);
      const hasCustomerAccounts = tableCheck.rows[0]?.exists === true;

      // Build UNION query from all available customer sources
      const unions: string[] = [];

      if (hasCustomerAccounts) {
        unions.push(`
          SELECT ca.id::text, ca.name, ca.email, ca.phone,
                 (SELECT COUNT(*) FROM jobs j WHERE j.customer_email = ca.email) as total_orders,
                 ca.created_at
          FROM customer_accounts ca
        `);
      }

      // Customers from jobs table
      const jobsExclude = hasCustomerAccounts
        ? `AND NOT EXISTS (SELECT 1 FROM customer_accounts ca WHERE ca.email = j.customer_email)`
        : '';
      unions.push(`
        SELECT 'job-' || MIN(j.id::text) as id, j.customer_name as name, j.customer_email as email, j.customer_phone as phone,
               COUNT(*) as total_orders,
               MIN(j.created_at) as created_at
        FROM jobs j
        WHERE j.customer_email IS NOT NULL AND j.customer_email != ''
          ${jobsExclude}
        GROUP BY j.customer_name, j.customer_email, j.customer_phone
      `);

      // Customers from legacy orders table
      const ordersExclude = hasCustomerAccounts
        ? `AND NOT EXISTS (SELECT 1 FROM customer_accounts ca WHERE ca.email = o.email)
           AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.customer_email = o.email)`
        : `AND NOT EXISTS (SELECT 1 FROM jobs j WHERE j.customer_email = o.email)`;
      unions.push(`
        SELECT 'ord-' || MIN(o.id::text) as id, o.customer_name as name, o.email, o.phone,
               COUNT(*) as total_orders,
               MIN(o.created_at) as created_at
        FROM orders o
        WHERE o.email IS NOT NULL AND o.email != ''
          ${ordersExclude}
        GROUP BY o.customer_name, o.email, o.phone
      `);

      const baseQuery = unions.join(' UNION ');
      let query = `SELECT id, name, email, phone, total_orders FROM (${baseQuery}) all_customers WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND (name ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++} OR phone ILIKE $${paramIndex++})`;
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      query += ` ORDER BY total_orders DESC, created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);
      
      // Get total count
      const countQuery = `SELECT COUNT(*) as count FROM (${baseQuery}) all_customers`;
      const countResult = await pool.query(countQuery);
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
      
      // Query directly from jobs table (primary source of all orders)
      // Note: 'orders' may be a VIEW on 'jobs', so querying both causes duplicates
      let baseQuery = `
        SELECT id::text, service_type, customer_name, customer_phone as phone, customer_email as email,
               pickup_address as street, '' as city, '' as state, '' as zip,
               pickup_lat::double precision as lat, pickup_lng::double precision as lng,
               scheduled_for::text as pickup_date, COALESCE(pickup_time_window, '') as pickup_time_window,
               COALESCE(items_json::text, '[]') as items_json, json_build_object('total', COALESCE(estimated_price, '0'))::text as pricing_json,
               status, assigned_driver_id::text, created_at, updated_at,
               (completion_photos IS NOT NULL AND completion_photos != '') as has_completion_photos,
               (signature_data IS NOT NULL AND signature_data != '') as has_signature,
               (photo_urls IS NOT NULL AND photo_urls != '') as has_photo_urls,
               paid_at::text, stripe_payment_intent_id::text,
               price_total_cents::integer, platform_fee_cents::integer,
               driver_earnings_cents::integer, payout_status::text
        FROM jobs
      `;
      
      let query = `SELECT combined.*, d.name as driver_name, COALESCE(NULLIF(TRIM(COALESCE(d.first_name, '') || ' ' || COALESCE(d.last_name, '')), ''), d.name) as driver_display_name, d.phone as driver_phone FROM (${baseQuery}) combined LEFT JOIN drivers d ON combined.assigned_driver_id = d.id::text WHERE 1=1`;
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

  // GET /admin/cashflow - Cash flow summary for dashboard
  app.get('/admin/cashflow', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      // Total revenue (paid orders)
      const paidResult = await pool.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(price_total_cents), 0) as total_cents
         FROM jobs WHERE paid_at IS NOT NULL`
      );

      // Platform fees earned
      const feesResult = await pool.query(
        `SELECT COALESCE(SUM(platform_fee_cents), 0) as total_fees_cents
         FROM jobs WHERE paid_at IS NOT NULL`
      );

      // Driver earnings
      const driverResult = await pool.query(
        `SELECT COALESCE(SUM(driver_earnings_cents), 0) as total_driver_cents
         FROM jobs WHERE paid_at IS NOT NULL`
      );

      // Unpaid orders (pending payment)
      const unpaidResult = await pool.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(CAST(estimated_price AS numeric)), 0) as total_estimated
         FROM jobs WHERE paid_at IS NULL AND status NOT IN ('cancelled', 'refunded')`
      );

      // Today's revenue
      const todayResult = await pool.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(price_total_cents), 0) as total_cents
         FROM jobs WHERE paid_at IS NOT NULL AND paid_at::date = CURRENT_DATE`
      );

      // This week's revenue
      const weekResult = await pool.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(price_total_cents), 0) as total_cents
         FROM jobs WHERE paid_at IS NOT NULL AND paid_at >= date_trunc('week', CURRENT_DATE)`
      );

      // This month's revenue
      const monthResult = await pool.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(price_total_cents), 0) as total_cents
         FROM jobs WHERE paid_at IS NOT NULL AND paid_at >= date_trunc('month', CURRENT_DATE)`
      );

      // Refunded orders
      const refundedResult = await pool.query(
        `SELECT COUNT(*) as count, COALESCE(SUM(price_total_cents), 0) as total_cents
         FROM jobs WHERE status = 'refunded'`
      );

      res.json({
        paid: {
          count: parseInt(paidResult.rows[0].count),
          totalCents: parseInt(paidResult.rows[0].total_cents),
        },
        platformFees: {
          totalCents: parseInt(feesResult.rows[0].total_fees_cents),
        },
        driverEarnings: {
          totalCents: parseInt(driverResult.rows[0].total_driver_cents),
        },
        unpaid: {
          count: parseInt(unpaidResult.rows[0].count),
          totalEstimated: parseFloat(unpaidResult.rows[0].total_estimated) || 0,
        },
        today: {
          count: parseInt(todayResult.rows[0].count),
          totalCents: parseInt(todayResult.rows[0].total_cents),
        },
        thisWeek: {
          count: parseInt(weekResult.rows[0].count),
          totalCents: parseInt(weekResult.rows[0].total_cents),
        },
        thisMonth: {
          count: parseInt(monthResult.rows[0].count),
          totalCents: parseInt(monthResult.rows[0].total_cents),
        },
        refunded: {
          count: parseInt(refundedResult.rows[0].count),
          totalCents: parseInt(refundedResult.rows[0].total_cents),
        },
      });
    } catch (err: any) {
      console.error('Cashflow error:', err);
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

  // ============================================================================
  // CREATE ORDER MANUALLY (admin)
  // ============================================================================
  app.post('/admin/orders/create', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const {
        customer_name, customer_phone, customer_email,
        service_type, pickup_address, description,
        estimated_price, scheduled_for, pickup_time_window,
        photo_urls, signature_data,
        assign_driver_id, mark_completed, mark_paid
      } = req.body;

      if (!customer_name || !customer_phone) {
        return res.status(400).json({ error: 'Customer name and phone are required' });
      }

      // Determine initial status
      let status = 'pending';
      if (mark_completed) status = 'completed';
      else if (assign_driver_id) status = 'assigned';

      // Calculate payment fields if marking as paid
      const priceTotalCents = mark_paid && estimated_price ? Math.round(parseFloat(estimated_price) * 100) : null;
      const platformFeeCents = priceTotalCents ? Math.round(priceTotalCents * 0.30) : null;
      const driverEarningsCents = priceTotalCents ? priceTotalCents - platformFeeCents! : null;
      const paidAt = mark_paid ? new Date().toISOString() : null;

      const result = await pool.query(
        `INSERT INTO jobs (
          customer_name, customer_phone, customer_email,
          service_type, pickup_address, description,
          estimated_price, scheduled_for, pickup_time_window,
          photo_urls, signature_data,
          assigned_driver_id, status,
          price_total_cents, platform_fee_cents, driver_earnings_cents, paid_at,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW()
        ) RETURNING *`,
        [
          customer_name, customer_phone, customer_email || null,
          service_type || 'HAUL_AWAY', pickup_address || null, description || null,
          estimated_price || '0', scheduled_for || null, pickup_time_window || null,
          photo_urls || null, signature_data || null,
          assign_driver_id || null, status,
          priceTotalCents, platformFeeCents, driverEarningsCents, paidAt
        ]
      );

      // Create job_assignment if driver assigned
      if (assign_driver_id && result.rows[0]) {
        try {
          await pool.query(
            'INSERT INTO job_assignments (job_id, driver_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [result.rows[0].id, assign_driver_id]
          );
        } catch (e) { /* ignore */ }
      }

      console.log(`[Admin] Manual order created: ${result.rows[0].id} for ${customer_name}`);
      res.json({ order: result.rows[0] });
    } catch (err: any) {
      console.error('Create order error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ============================================================================
  // COMPLETE & MARK PAID (admin)
  // ============================================================================
  app.put('/admin/orders/:id/complete-paid', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const { price_total } = req.body;
      if (!price_total || isNaN(parseFloat(price_total))) {
        return res.status(400).json({ error: 'price_total is required (in dollars)' });
      }

      const priceTotalCents = Math.round(parseFloat(price_total) * 100);
      const platformFeeCents = Math.round(priceTotalCents * 0.30);
      const driverEarningsCents = priceTotalCents - platformFeeCents;

      // Try jobs table first
      let result = await pool.query(
        `UPDATE jobs SET
          status = 'completed',
          price_total_cents = $1,
          platform_fee_cents = $2,
          driver_earnings_cents = $3,
          paid_at = NOW(),
          updated_at = NOW()
        WHERE id = $4 RETURNING *`,
        [priceTotalCents, platformFeeCents, driverEarningsCents, req.params.id]
      );

      if (result.rows.length === 0) {
        // Try orders table (legacy)
        result = await pool.query(
          `UPDATE orders SET
            status = 'completed',
            updated_at = NOW()
          WHERE id::text = $1 RETURNING *`,
          [req.params.id]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log(`[Admin] Order ${req.params.id} COMPLETED & PAID: $${price_total} (${priceTotalCents}c)`);
      res.json({ order: result.rows[0] });
    } catch (err: any) {
      console.error('Complete & pay order error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /admin/orders/:id - Permanently delete an order
  app.delete('/admin/orders/:id', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      const orderId = req.params.id;

      // Try to delete from job_assignments first
      try {
        await pool.query('DELETE FROM job_assignments WHERE job_id = $1', [orderId]);
      } catch (e) { /* ignore if table doesn't exist */ }

      // Try jobs table first (primary)
      let result = await pool.query('DELETE FROM jobs WHERE id = $1 RETURNING id', [orderId]);

      if (result.rows.length === 0) {
        // Try orders table (legacy)
        result = await pool.query('DELETE FROM orders WHERE id::text = $1 RETURNING id', [orderId]);
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      console.log(`[Admin] Order ${orderId} PERMANENTLY DELETED`);
      res.json({ success: true, deleted_id: orderId });
    } catch (err: any) {
      console.error('Delete order error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PUT /admin/orders/:id/reactivate - Reactivate a cancelled order (set status back to pending)
  app.put('/admin/orders/:id/reactivate', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      // Try jobs table first
      let result = await pool.query(
        `UPDATE jobs SET status = 'pending', updated_at = NOW() WHERE id = $1 AND status = 'cancelled' RETURNING *`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        // Try orders table (legacy)
        result = await pool.query(
          `UPDATE orders SET status = 'pending', updated_at = NOW() WHERE id::text = $1 AND status = 'cancelled' RETURNING *`,
          [req.params.id]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found or not cancelled' });
      }

      console.log(`[Admin] Order ${req.params.id} REACTIVATED (cancelled → pending)`);
      res.json({ order: result.rows[0] });
    } catch (err: any) {
      console.error('Reactivate order error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Debug endpoint: Check driver_locations table contents directly
  app.get('/admin/debug/driver-locations', requireAdmin, async (req, res) => {
    try {
      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: 'Database not available' });

      // Check if table exists
      const tableCheck = await pool.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'driver_locations') as table_exists`
      );

      if (!tableCheck.rows[0]?.table_exists) {
        return res.json({ table_exists: false, rows: [], message: 'driver_locations table does not exist' });
      }

      // Get all rows from driver_locations
      const locResult = await pool.query(`SELECT * FROM driver_locations ORDER BY updated_at DESC`);

      // Get driver IDs for comparison
      const driversResult = await pool.query(`SELECT id, name, email FROM drivers WHERE status = 'approved'`);

      // Check table schema
      const schemaResult = await pool.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = 'driver_locations' 
         ORDER BY ordinal_position`
      );

      // Check indexes
      const indexResult = await pool.query(
        `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'driver_locations'`
      );

      res.json({
        table_exists: true,
        location_rows: locResult.rows,
        location_count: locResult.rows.length,
        approved_drivers: driversResult.rows.map((d: any) => ({ id: d.id, id_type: typeof d.id, name: d.name, email: d.email })),
        table_schema: schemaResult.rows,
        indexes: indexResult.rows,
      });
    } catch (err: any) {
      console.error('Debug driver locations error:', err);
      res.status(500).json({ error: err.message });
    }
  });
}
