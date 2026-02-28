import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

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
    console.log("[CustomerApi] PostgreSQL connection established");
    return pgPool;
  } catch (e) {
    console.error("[CustomerApi] Failed to connect to PostgreSQL:", e);
    pgPool = null;
    return null;
  }
}

// JWT middleware helper for customer tokens
function verifyCustomerToken(req: any): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(
      authHeader.split(" ")[1],
      process.env.JWT_SECRET || "secret"
    );
    if ((decoded as any).role !== "customer") return null;
    return decoded;
  } catch (e) {
    return null;
  }
}

export function registerCustomerApiRoutes(app: Express) {
  // ================================================================
  // ENSURE TABLES EXIST
  // ================================================================
  (async () => {
    try {
      const pool = await getPgPool();
      if (!pool) return;

      // Ensure customers table exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS customer_accounts (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("[CustomerApi] customer_accounts table ensured");

      // Ensure order_tracking_tokens table for anonymous order access
      await pool.query(`
        CREATE TABLE IF NOT EXISTS order_tracking_tokens (
          id SERIAL PRIMARY KEY,
          job_id TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          customer_email TEXT,
          customer_phone TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("[CustomerApi] order_tracking_tokens table ensured");

      // Ensure push_subscriptions table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id SERIAL PRIMARY KEY,
          customer_id TEXT,
          job_id TEXT,
          endpoint TEXT NOT NULL,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("[CustomerApi] push_subscriptions table ensured");

      // Add customer_account_id column to jobs if not exists
      try {
        await pool.query(
          `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS customer_account_id TEXT`
        );
        console.log("[CustomerApi] customer_account_id column ensured on jobs");
      } catch (e) {
        console.warn("[CustomerApi] Could not add customer_account_id:", (e as any)?.message);
      }

      // Add tracking_token column to jobs if not exists
      try {
        await pool.query(
          `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tracking_token TEXT`
        );
        console.log("[CustomerApi] tracking_token column ensured on jobs");
      } catch (e) {
        console.warn("[CustomerApi] Could not add tracking_token:", (e as any)?.message);
      }
    } catch (e) {
      console.error("[CustomerApi] Table setup error:", (e as any)?.message);
    }
  })();

  // ================================================================
  // POST /customer/register - Register new customer account
  // ================================================================
  app.post("/customer/register", async (req: Request, res: Response) => {
    try {
      const { name, email, phone, password } = req.body;

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ error: "Name, email and password are required" });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      // Check if email already exists
      const existing = await pool.query(
        "SELECT id FROM customer_accounts WHERE email = $1",
        [email]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        `INSERT INTO customer_accounts (name, email, phone, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, name, email, phone`,
        [name, email, phone || "", hashedPassword]
      );

      const customer = result.rows[0];
      const token = jwt.sign(
        { customerId: customer.id, email: customer.email, role: "customer" },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "30d" }
      );

      // Link any existing orders by email
      await pool.query(
        "UPDATE jobs SET customer_account_id = $1 WHERE customer_email = $2 AND customer_account_id IS NULL",
        [customer.id, email]
      );

      console.log("[CustomerApi] Registered customer:", customer.email);
      res.json({ success: true, token, customer });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[CustomerApi] Register error:", msg);
      res.status(500).json({ error: "Registration failed", details: msg });
    }
  });

  // ================================================================
  // POST /customer/login - Login customer
  // ================================================================
  app.post("/customer/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      const result = await pool.query(
        "SELECT id, name, email, phone, password_hash FROM customer_accounts WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const customer = result.rows[0];
      const isValid = await bcrypt.compare(password, customer.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        { customerId: customer.id, email: customer.email, role: "customer" },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "30d" }
      );

      console.log("[CustomerApi] Login:", customer.email);
      res.json({
        success: true,
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[CustomerApi] Login error:", msg);
      res.status(500).json({ error: "Login failed", details: msg });
    }
  });

  // ================================================================
  // GET /customer/me - Get current customer profile
  // ================================================================
  app.get("/customer/me", async (req: Request, res: Response) => {
    try {
      const decoded = verifyCustomerToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      const result = await pool.query(
        "SELECT id, name, email, phone, created_at FROM customer_accounts WHERE id = $1",
        [decoded.customerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json({ success: true, customer: result.rows[0] });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to get profile", details: msg });
    }
  });

  // ================================================================
  // PUT /customer/me - Update customer profile
  // ================================================================
  app.put("/customer/me", async (req: Request, res: Response) => {
    try {
      const decoded = verifyCustomerToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { name, phone } = req.body;
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      const result = await pool.query(
        "UPDATE customer_accounts SET name = COALESCE($1, name), phone = COALESCE($2, phone), updated_at = NOW() WHERE id = $3 RETURNING id, name, email, phone",
        [name || null, phone || null, decoded.customerId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json({ success: true, customer: result.rows[0] });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Update failed", details: msg });
    }
  });

  // ================================================================
  // GET /customer/orders - Get customer's orders
  // ================================================================
  app.get("/customer/orders", async (req: Request, res: Response) => {
    try {
      const decoded = verifyCustomerToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      const status = req.query.status as string;
      let query = `
        SELECT id, customer_name, customer_phone, customer_email, service_type, status,
               pickup_address, pickup_lat, pickup_lng, description, estimated_price,
               items_json, scheduled_for, pickup_time_window, assigned_driver_id,
               tracking_token, created_at, updated_at
        FROM jobs
        WHERE (customer_account_id = $1 OR customer_email = $2)
      `;
      const params: any[] = [decoded.customerId, decoded.email];

      if (status === "active") {
        query += ` AND status NOT IN ('completed', 'cancelled')`;
      } else if (status === "completed") {
        query += ` AND status = 'completed'`;
      }

      query += ` ORDER BY created_at DESC LIMIT 50`;

      const result = await pool.query(query, params);

      // Enrich with driver info if assigned
      const orders = await Promise.all(
        result.rows.map(async (order: any) => {
          if (order.assigned_driver_id) {
            try {
              const driverResult = await pool.query(
                "SELECT id, name, phone FROM drivers WHERE id = $1",
                [order.assigned_driver_id]
              );
              if (driverResult.rows.length > 0) {
                order.driver = driverResult.rows[0];
              }
            } catch (e) {
              // ignore
            }
          }
          return order;
        })
      );

      res.json({ success: true, orders });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to get orders", details: msg });
    }
  });

  // ================================================================
  // GET /customer/orders/:id - Get single order detail
  // ================================================================
  app.get("/customer/orders/:id", async (req: Request, res: Response) => {
    try {
      const decoded = verifyCustomerToken(req);
      if (!decoded) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      const result = await pool.query(
        `SELECT * FROM jobs WHERE id = $1 AND (customer_account_id = $2 OR customer_email = $3)`,
        [req.params.id, decoded.customerId, decoded.email]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      const order = result.rows[0];

      // Get driver info if assigned
      if (order.assigned_driver_id) {
        try {
          const driverResult = await pool.query(
            "SELECT id, name, phone FROM drivers WHERE id = $1",
            [order.assigned_driver_id]
          );
          if (driverResult.rows.length > 0) {
            order.driver = driverResult.rows[0];
          }
        } catch (e) {
          // ignore
        }
      }

      // Get driver location if assigned and in_progress
      if (
        order.assigned_driver_id &&
        ["assigned", "in_progress", "en_route", "arrived"].includes(order.status)
      ) {
        try {
          const locResult = await pool.query(
            "SELECT lat, lng, updated_at FROM driver_locations WHERE driver_id = $1 ORDER BY updated_at DESC LIMIT 1",
            [order.assigned_driver_id]
          );
          if (locResult.rows.length > 0) {
            order.driver_location = locResult.rows[0];
          }
        } catch (e) {
          // driver_locations table may not exist yet
        }
      }

      res.json({ success: true, order });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to get order", details: msg });
    }
  });

  // ================================================================
  // POST /customer/orders/:id/track - Track order by token (anonymous)
  // ================================================================
  app.post("/customer/orders/track", async (req: Request, res: Response) => {
    try {
      let { token, orderId } = req.body;

      // Strip leading # if present (users copy "#uuid" from the site)
      if (token && typeof token === 'string') token = token.replace(/^#/, '');
      if (orderId && typeof orderId === 'string') orderId = orderId.replace(/^#/, '');

      if (!token && !orderId) {
        return res
          .status(400)
          .json({ error: "Token or order ID is required" });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      let order = null;

      // Look up by tracking token first
      if (token) {
        const result = await pool.query(
          "SELECT * FROM jobs WHERE tracking_token = $1",
          [token]
        );
        if (result.rows.length > 0) {
          order = result.rows[0];
        } else {
          // Also check the order_tracking_tokens table
          const tokenResult = await pool.query(
            "SELECT job_id FROM order_tracking_tokens WHERE token = $1",
            [token]
          );
          if (tokenResult.rows.length > 0) {
            const jobResult = await pool.query(
              "SELECT * FROM jobs WHERE id = $1",
              [tokenResult.rows[0].job_id]
            );
            if (jobResult.rows.length > 0) {
              order = jobResult.rows[0];
            }
          }
        }
      }

      // Look up by order ID
      if (!order && orderId) {
        const result = await pool.query(
          "SELECT * FROM jobs WHERE id::text = $1",
          [orderId]
        );
        if (result.rows.length > 0) {
          order = result.rows[0];
        }
      }

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Get driver info if assigned
      if (order.assigned_driver_id) {
        try {
          const driverResult = await pool.query(
            "SELECT id, name, phone FROM drivers WHERE id = $1",
            [order.assigned_driver_id]
          );
          if (driverResult.rows.length > 0) {
            order.driver = driverResult.rows[0];
          }
        } catch (e) {
          // ignore
        }

        // Get driver location
        try {
          const locResult = await pool.query(
            "SELECT lat, lng, updated_at FROM driver_locations WHERE driver_id = $1 ORDER BY updated_at DESC LIMIT 1",
            [order.assigned_driver_id]
          );
          if (locResult.rows.length > 0) {
            order.driver_location = locResult.rows[0];
          }
        } catch (e) {
          // ignore
        }
      }

      res.json({ success: true, order });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Failed to track order", details: msg });
    }
  });

  // ================================================================
  // POST /customer/push/subscribe - Save push subscription
  // ================================================================
  app.post(
    "/customer/push/subscribe",
    async (req: Request, res: Response) => {
      try {
        const { subscription, jobId } = req.body;

        if (!subscription || !subscription.endpoint) {
          return res
            .status(400)
            .json({ error: "Push subscription is required" });
        }

        const pool = await getPgPool();
        if (!pool) {
          return res.status(500).json({ error: "Database not available" });
        }

        const decoded = verifyCustomerToken(req);
        const customerId = decoded?.customerId || null;

        // Upsert subscription
        await pool.query(
          `INSERT INTO push_subscriptions (customer_id, job_id, endpoint, p256dh, auth, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (endpoint) DO UPDATE SET
             customer_id = COALESCE($1, push_subscriptions.customer_id),
             job_id = COALESCE($2, push_subscriptions.job_id),
             p256dh = $4, auth = $5`,
          [
            customerId,
            jobId || null,
            subscription.endpoint,
            subscription.keys?.p256dh || "",
            subscription.keys?.auth || "",
          ]
        );

        // Add unique constraint on endpoint if not exists
        try {
          await pool.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_idx ON push_subscriptions (endpoint)`
          );
        } catch (e) {
          // ignore
        }

        console.log("[CustomerApi] Push subscription saved for", customerId || "anonymous");
        res.json({ success: true });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: "Failed to save subscription", details: msg });
      }
    }
  );

  // ================================================================
  // GET /customer/push/vapid-key - Get VAPID public key
  // ================================================================
  app.get("/customer/push/vapid-key", async (_req: Request, res: Response) => {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
    if (!vapidPublicKey) {
      return res
        .status(500)
        .json({ error: "VAPID key not configured on server" });
    }
    res.json({ success: true, publicKey: vapidPublicKey });
  });

  // ================================================================
  // Helper: Generate tracking token for a job (called from webCompatRoutes)
  // ================================================================
  app.post(
    "/internal/generate-tracking-token",
    async (req: Request, res: Response) => {
      try {
        const { jobId } = req.body;
        if (!jobId) {
          return res.status(400).json({ error: "jobId is required" });
        }

        const pool = await getPgPool();
        if (!pool) {
          return res.status(500).json({ error: "Database not available" });
        }

        // Generate a unique token
        const trackingToken = crypto.randomBytes(32).toString("hex");

        // Store on the job itself
        await pool.query(
          "UPDATE jobs SET tracking_token = $1 WHERE id = $2",
          [trackingToken, jobId]
        );

        // Also store in tracking tokens table
        const jobResult = await pool.query(
          "SELECT customer_email, customer_phone FROM jobs WHERE id = $1",
          [jobId]
        );
        const job = jobResult.rows[0];

        await pool.query(
          `INSERT INTO order_tracking_tokens (job_id, token, customer_email, customer_phone, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [
            jobId,
            trackingToken,
            job?.customer_email || null,
            job?.customer_phone || null,
          ]
        );

        console.log("[CustomerApi] Generated tracking token for job:", jobId);
        res.json({ success: true, trackingToken });
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        res.status(500).json({ error: "Failed to generate token", details: msg });
      }
    }
  );

  console.log(
    "[CustomerApi] Registered customer routes: /customer/register, /customer/login, /customer/me, /customer/orders, /customer/orders/:id, /customer/orders/track, /customer/push/*"
  );
}
