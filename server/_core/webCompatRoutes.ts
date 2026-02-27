/**
 * Web Compatibility Routes
 *
 * These REST endpoints provide backward compatibility for the web app's
 * Next.js API proxy routes that previously pointed to packages/api (PostgreSQL).
 * They use PostgreSQL directly (like adminApi.ts) to match the production database.
 *
 * Endpoints:
 *   POST /quotes              -> pricing calculation (hardcoded tiers)
 *   POST /jobs                -> order creation in the orders table
 *   GET  /jobs/:id            -> order/job lookup
 *   POST /jobs/:id/pay        -> payment status update + dispatch
 *   GET  /service-areas/lookup -> service area coverage check (state-based)
 */

import { Express, Request, Response } from "express";
import crypto from "crypto";

// Approved states for service area coverage
const APPROVED_STATES = ["NJ", "MA", "PA", "NY", "CT"];

// Hardcoded pricing tiers (matches what packages/api used)
const VOLUME_PRICES: Record<string, { price: number; label: string }> = {
  EIGHTH:          { price: 109, label: "1/8 Truck Load" },
  QUARTER:         { price: 169, label: "1/4 Truck Load" },
  HALF:            { price: 279, label: "1/2 Truck Load" },
  THREE_QUARTER:   { price: 389, label: "3/4 Truck Load" },
  FULL:            { price: 529, label: "Full Truck Load" },
  "1_8":           { price: 109, label: "1/8 Truck Load" },
  "1_4":           { price: 169, label: "1/4 Truck Load" },
  "1_2":           { price: 279, label: "1/2 Truck Load" },
  "3_4":           { price: 389, label: "3/4 Truck Load" },
  full:            { price: 529, label: "Full Truck Load" },
};

const ADDON_PRICES: Record<string, { price: number; label: string }> = {
  SAME_DAY:    { price: 50, label: "Same Day Pickup" },
  HEAVY_ITEM:  { price: 25, label: "Heavy Item" },
  STAIRS:      { price: 20, label: "Stairs" },
  DISASSEMBLY: { price: 30, label: "Disassembly" },
};

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
    console.error("[WebCompat] Failed to connect to PostgreSQL:", e);
    return null;
  }
}

export function registerWebCompatRoutes(app: Express) {
  // ================================================================
  // POST /quotes - Calculate a price quote
  // ================================================================
  app.post("/quotes", async (req: Request, res: Response) => {
    try {
      const { serviceType, volumeTier, addons: addonList } = req.body;

      const tier = volumeTier || "QUARTER";
      const volumeInfo = VOLUME_PRICES[tier];
      if (!volumeInfo) {
        return res.status(400).json({ error: "Invalid volume tier", success: false });
      }

      const servicePrice = volumeInfo.price;
      let addonPrice = 0;
      const breakdown: Array<{ label: string; amount: number }> = [];

      breakdown.push({ label: volumeInfo.label, amount: servicePrice });

      if (addonList && Array.isArray(addonList)) {
        for (const addonName of addonList) {
          const addon = ADDON_PRICES[addonName];
          if (addon) {
            addonPrice += addon.price;
            breakdown.push({ label: addon.label, amount: addon.price });
          }
        }
      }

      const distancePrice = 0;
      const disposalIncluded = 50;
      const subtotal = servicePrice + addonPrice + distancePrice;
      const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
      const total = subtotal + platformFee;

      if (platformFee > 0) {
        breakdown.push({ label: "Platform Fee", amount: platformFee });
      }

      console.log("[WebCompat] POST /quotes - tier=" + tier + " total=$" + total);

      res.json({
        success: true,
        servicePrice,
        addonPrice,
        distancePrice,
        disposalIncluded,
        total,
        subtotal,
        platformFee,
        breakdown,
        serviceType: serviceType || "HAUL_AWAY",
        volumeTier: tier,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[WebCompat] POST /quotes error:", msg);
      res.status(500).json({ error: "Failed to calculate quote", details: msg, success: false });
    }
  });

  // ================================================================
  // POST /jobs - Create a new job in the PostgreSQL jobs table
  // IMPORTANT: Inserts into 'jobs' table (not 'orders') so that
  // driver app (/driver/orders/available) and admin dashboard
  // can both see the job immediately.
  // ================================================================
  app.post("/jobs", async (req: Request, res: Response) => {
    try {
      const {
        serviceType,
        pickupLat,
        pickupLng,
        pickupAddress,
        scheduledFor,
        volumeTier,
        addons: addonList,
        customerName,
        customerPhone,
        customerEmail,
        customerNotes,
        total: quotedTotal,
        timeWindow,
      } = req.body;

      if (!pickupAddress && !customerName) {
        return res.status(400).json({ error: "pickupAddress or customerName is required", success: false });
      }

      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available", success: false });
      }

      let totalAmount = quotedTotal || 0;
      if (!totalAmount) {
        const t = volumeTier || "QUARTER";
        const vi = VOLUME_PRICES[t];
        const basePrice = vi ? vi.price : 169;
        let addonTotal = 0;
        if (addonList && Array.isArray(addonList)) {
          for (const a of addonList) {
            const ad = ADDON_PRICES[a];
            if (ad) addonTotal += ad.price;
          }
        }
        const sub = basePrice + addonTotal;
        const pf = Math.round(sub * 0.05 * 100) / 100;
        totalAmount = sub + pf;
      }

      const itemsJson = JSON.stringify(addonList || []);

      // Insert into jobs table (single source of truth for driver + admin)
      const result = await pool.query(
        `INSERT INTO jobs (
          customer_name, customer_phone, customer_email,
          service_type, status, pickup_address,
          pickup_lat, pickup_lng,
          description, estimated_price, items_json, scheduled_for,
          pickup_time_window,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *`,
        [
          customerName || "Web Customer",
          customerPhone || "",
          customerEmail || "",
          serviceType || "HAUL_AWAY",
          pickupAddress || "",
          pickupLat || 0,
          pickupLng || 0,
          customerNotes || "",
          totalAmount,
          itemsJson,
          scheduledFor || null,
          timeWindow || null,
        ]
      );

      const job = result.rows[0];
      console.log("[WebCompat] POST /jobs - created job id=" + job.id + " status=" + job.status + " total=$" + totalAmount + " at=" + job.created_at);

      // Generate tracking token for anonymous order tracking via PWA
      let trackingToken = "";
      try {
        trackingToken = crypto.randomBytes(32).toString("hex");
        await pool.query("UPDATE jobs SET tracking_token = $1 WHERE id = $2", [trackingToken, job.id]);
        console.log("[WebCompat] POST /jobs - tracking token generated for job " + job.id);
      } catch (tokenErr) {
        console.warn("[WebCompat] Could not generate tracking token:", tokenErr);
      }

      // Verify it exists in DB immediately
      const verify = await pool.query("SELECT id, status, created_at FROM jobs WHERE id = $1", [job.id]);
      console.log("[WebCompat] POST /jobs - DB verify: " + (verify.rows.length > 0 ? "EXISTS" : "MISSING") + " id=" + job.id);

      res.status(201).json({
        success: true,
        id: job.id,
        status: job.status,
        total: totalAmount,
        trackingToken,
        order: job,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[WebCompat] POST /jobs error:", msg);
      res.status(500).json({ error: "Failed to create job", details: msg, success: false });
    }
  });

  // ================================================================
  // GET /jobs/:id - Get order/job status
  // ================================================================
  app.get("/jobs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available", success: false });
      }

      // Check jobs table first (primary), then orders table (legacy)
      let result = await pool.query("SELECT * FROM jobs WHERE id::text = $1", [id]);
      if (result.rows.length === 0) {
        result = await pool.query("SELECT * FROM orders WHERE id::text = $1", [id]);
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Job not found", success: false });
      }

      const order = result.rows[0];
      console.log("[WebCompat] GET /jobs/" + id + " - status=" + order.status);

      let total = 0;
      try {
        const pricing = typeof order.pricing_json === "string"
          ? JSON.parse(order.pricing_json)
          : order.pricing_json;
        total = pricing?.total || 0;
      } catch {
        total = 0;
      }

      res.json({
        success: true,
        id: order.id,
        status: order.status,
        total,
        order,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[WebCompat] GET /jobs/:id error:", msg);
      res.status(500).json({ error: "Failed to get job", details: msg, success: false });
    }
  });

  // ================================================================
  // POST /jobs/:id/pay - Process payment for an order
  // ================================================================
  app.post("/jobs/:id/pay", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available", success: false });
      }

      // Check jobs table first (primary), then orders table (legacy)
      let result = await pool.query("SELECT * FROM jobs WHERE id::text = $1", [id]);
      let tableName = "jobs";
      if (result.rows.length === 0) {
        result = await pool.query("SELECT * FROM orders WHERE id::text = $1", [id]);
        tableName = "orders";
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Job not found", success: false });
      }

      await pool.query(
        "UPDATE " + tableName + " SET status = $1, updated_at = NOW() WHERE id::text = $2",
        ["dispatching", id]
      );

      try {
        const driversResult = await pool.query(
          "SELECT id, name FROM drivers WHERE (status = $1 OR driver_status = $1) AND is_active = true LIMIT 5",
          ["approved"]
        );
        if (driversResult.rows.length > 0) {
          for (const driver of driversResult.rows) {
            try {
              await pool.query(
                "INSERT INTO job_assignments (job_id, driver_id, status, created_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT DO NOTHING",
                [id, driver.id, "offered"]
              );
            } catch (assignErr) {
              console.warn("[WebCompat] Could not assign driver " + driver.id + ":", assignErr);
            }
          }
          console.log("[WebCompat] Dispatch: " + driversResult.rows.length + " drivers offered for order " + id);
        } else {
          console.log("[WebCompat] Dispatch: no active drivers for order " + id);
        }
      } catch (dispatchErr) {
        console.warn("[WebCompat] Dispatch error (non-fatal):", dispatchErr);
      }

      const updatedResult = await pool.query(
        "SELECT * FROM " + tableName + " WHERE id::text = $1",
        [id]
      );
      const updatedOrder = updatedResult.rows[0];

      console.log("[WebCompat] POST /jobs/" + id + "/pay - payment processed");

      res.json({
        success: true,
        message: "Payment processed successfully",
        job: updatedOrder,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[WebCompat] POST /jobs/:id/pay error:", msg);
      res.status(500).json({ error: "Failed to process payment", details: msg, success: false });
    }
  });

  // ================================================================
  // GET /service-areas/lookup - Check if coordinates are covered
  // ================================================================
  app.get("/service-areas/lookup", async (req: Request, res: Response) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);

      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: "Invalid lat/lng parameters", covered: false });
      }

      // Use reverse geocoding to determine the state, then check if approved
      try {
        const geocodeUrl = "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + String(lat) + "&lon=" + String(lng) + "&accept-language=en-US";
        const geocodeResp = await fetch(geocodeUrl, {
          headers: { "User-Agent": "Haulkind/1.0" },
        });

        if (geocodeResp.ok) {
          const geocodeData = await geocodeResp.json();
          const addressState = geocodeData.address?.state;

          const stateMap: Record<string, string> = {
            "New Jersey": "NJ",
            "Massachusetts": "MA",
            "Pennsylvania": "PA",
            "New York": "NY",
            "Connecticut": "CT",
          };

          const stateAbbr = stateMap[addressState] || addressState;

          if (APPROVED_STATES.includes(stateAbbr)) {
            console.log("[WebCompat] GET /service-areas/lookup - covered: " + stateAbbr);
            return res.json({
              covered: true,
              serviceArea: {
                id: 1,
                name: stateAbbr + " Service Area",
                state: stateAbbr,
              },
            });
          }
        }
      } catch (geocodeErr) {
        console.warn("[WebCompat] Geocoding failed, using bounding box fallback:", geocodeErr);
      }

      // Fallback: bounding box for northeast US (NJ/NY/CT/MA/PA)
      if (lat >= 39 && lat <= 43 && lng >= -76 && lng <= -70) {
        console.log("[WebCompat] GET /service-areas/lookup - covered by bounding box (" + lat + ", " + lng + ")");
        return res.json({
          covered: true,
          serviceArea: {
            id: 1,
            name: "Northeast Service Area",
            state: "NJ",
          },
        });
      }

      console.log("[WebCompat] GET /service-areas/lookup - not covered (" + lat + ", " + lng + ")");
      res.json({
        covered: false,
        serviceArea: null,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[WebCompat] GET /service-areas/lookup error:", msg);
      res.status(500).json({ error: "Service area lookup failed", details: msg, covered: false });
    }
  });

  // ================================================================
  // GET /debug/jobs - Debug endpoint to verify job data (TEMP)
  // ================================================================
  app.get("/debug/jobs", async (req: Request, res: Response) => {
    try {
      const pool = await getPgPool();
      if (!pool) {
        return res.status(500).json({ error: "Database not available" });
      }

      const limit = parseInt(req.query.limit as string) || 20;

      const jobsResult = await pool.query(
        "SELECT id, status, customer_name, service_type, estimated_price, created_at FROM jobs ORDER BY created_at DESC LIMIT $1",
        [limit]
      );

      const ordersResult = await pool.query(
        "SELECT id, status, customer_name, service_type, pricing_json, created_at FROM orders ORDER BY created_at DESC LIMIT $1",
        [limit]
      );

      res.json({
        api_base_url: "https://haulkind-production-285b.up.railway.app",
        timestamp: new Date().toISOString(),
        jobs_table: {
          count: jobsResult.rows.length,
          rows: jobsResult.rows,
        },
        orders_table: {
          count: ordersResult.rows.length,
          rows: ordersResult.rows,
        },
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ error: "Debug query failed", details: msg });
    }
  });

  console.log("[WebCompat] Registered compatibility routes: /quotes, /jobs, /jobs/:id, /jobs/:id/pay, /service-areas/lookup, /debug/jobs");
}
