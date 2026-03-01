/**
 * Stripe Connect Routes
 *
 * Implements full payment marketplace flow:
 * - Driver onboarding via Stripe Connect Express
 * - Customer checkout via Stripe Checkout Sessions
 * - Webhook handling for payment events
 * - Weekly payout runner (transfers to driver Connect accounts)
 * - Ledger events for audit trail
 *
 * Endpoints:
 *   POST /api/stripe/connect/create-driver-account
 *   POST /api/stripe/connect/create-account-link
 *   GET  /api/stripe/connect/status
 *   POST /api/checkout/create
 *   POST /api/stripe/webhook  (raw body, signature verified)
 *   POST /api/jobs/:id/complete
 *   POST /api/payouts/run-weekly
 *   POST /api/payouts/retry-item/:id
 *   GET  /api/driver/earnings-summary
 *   GET  /admin/payouts
 *   GET  /admin/payouts/:id
 */

import type { Express, Request, Response } from "express";
import jwt from "jsonwebtoken";

// ============================================================================
// DATABASE CONNECTION
// ============================================================================
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
    return pgPool;
  } catch (e) {
    console.error("[Stripe] Failed to connect to PostgreSQL:", e);
    pgPool = null;
    return null;
  }
}

// ============================================================================
// STRIPE CLIENT (lazy init)
// ============================================================================
let stripeClient: any = null;
async function getStripe() {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn("[Stripe] STRIPE_SECRET_KEY not set — Stripe features disabled");
    return null;
  }
  try {
    const stripeMod = await import("stripe");
    const Stripe = stripeMod.default || stripeMod;
    stripeClient = new Stripe(key, { apiVersion: "2024-12-18.acacia" });
    console.log("[Stripe] Client initialized");
    return stripeClient;
  } catch (e) {
    console.error("[Stripe] Failed to initialize:", e);
    return null;
  }
}

// ============================================================================
// JWT HELPERS
// ============================================================================
function verifyDriverToken(req: any): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "secret");
    if ((decoded as any).role !== "driver") return null;
    return decoded;
  } catch (e) {
    return null;
  }
}

function verifyAdminToken(req: any): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "secret");
    if ((decoded as any).role !== "admin") return null;
    return decoded;
  } catch (e) {
    return null;
  }
}

function verifyAnyToken(req: any): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "secret");
  } catch (e) {
    return null;
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================
const PLATFORM_FEE_RATE = 0.30; // 30% platform commission

// ============================================================================
// LEDGER EVENT HELPER
// ============================================================================
async function createLedgerEvent(
  pool: any,
  type: string,
  driverId: string | null,
  jobId: string | null,
  amountCents: number,
  metadata: any = {}
) {
  try {
    await pool.query(
      `INSERT INTO ledger_events (type, driver_id, job_id, amount_cents, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [type, driverId, jobId, amountCents, JSON.stringify(metadata)]
    );
  } catch (e) {
    console.error("[Stripe] Failed to create ledger event:", e);
  }
}

// ============================================================================
// REGISTER ROUTES
// ============================================================================
export function registerStripeRoutes(app: Express) {

  // ==========================================================================
  // DATABASE MIGRATION — ensure Stripe tables/columns exist
  // ==========================================================================
  (async () => {
    try {
      const pool = await getPgPool();
      if (!pool) return;

      // Add Stripe columns to drivers table
      await pool.query(`
        ALTER TABLE drivers
        ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
        ADD COLUMN IF NOT EXISTS stripe_onboarding_status TEXT DEFAULT 'not_started',
        ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT false
      `);
      console.log("[Stripe] Driver Stripe columns ensured");

      // Add Stripe/payout columns to jobs table
      await pool.query(`
        ALTER TABLE jobs
        ADD COLUMN IF NOT EXISTS price_total_cents INTEGER,
        ADD COLUMN IF NOT EXISTS platform_fee_cents INTEGER,
        ADD COLUMN IF NOT EXISTS driver_earnings_cents INTEGER,
        ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
        ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT,
        ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
        ADD COLUMN IF NOT EXISTS stripe_fee_cents INTEGER,
        ADD COLUMN IF NOT EXISTS payout_status TEXT DEFAULT 'not_eligible',
        ADD COLUMN IF NOT EXISTS payout_batch_id TEXT,
        ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP
      `);
      console.log("[Stripe] Jobs Stripe columns ensured");

      // Create payouts table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payouts (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          period_start DATE NOT NULL,
          period_end DATE NOT NULL,
          scheduled_for TIMESTAMP NOT NULL,
          status TEXT NOT NULL DEFAULT 'created',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("[Stripe] Payouts table ensured");

      // Create payout_items table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS payout_items (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          payout_id TEXT REFERENCES payouts(id),
          driver_id TEXT NOT NULL,
          amount_cents INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          stripe_transfer_id TEXT,
          failure_reason TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("[Stripe] Payout items table ensured");

      // Create ledger_events table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ledger_events (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          type TEXT NOT NULL,
          driver_id TEXT,
          job_id TEXT,
          amount_cents INTEGER NOT NULL DEFAULT 0,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("[Stripe] Ledger events table ensured");

    } catch (e) {
      console.error("[Stripe] Migration error:", (e as any)?.message);
    }
  })();

  // ==========================================================================
  // DRIVER CONNECT: Create Express Account
  // POST /api/stripe/connect/create-driver-account
  // ==========================================================================
  app.post("/api/stripe/connect/create-driver-account", async (req: Request, res: Response) => {
    try {
      const decoded = verifyDriverToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const stripe = await getStripe();
      if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      // Check if driver already has a Stripe account
      const driverResult = await pool.query(
        "SELECT stripe_account_id, name, email, phone FROM drivers WHERE id = $1",
        [decoded.driverId]
      );
      if (driverResult.rows.length === 0) {
        return res.status(404).json({ error: "Driver not found" });
      }

      const driver = driverResult.rows[0];

      if (driver.stripe_account_id) {
        return res.json({
          success: true,
          accountId: driver.stripe_account_id,
          message: "Stripe account already exists",
        });
      }

      // Create Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: driver.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          driver_id: decoded.driverId,
          platform: "haulkind",
        },
      });

      // Save to DB
      await pool.query(
        `UPDATE drivers SET stripe_account_id = $1, stripe_onboarding_status = 'pending', updated_at = NOW() WHERE id = $2`,
        [account.id, decoded.driverId]
      );

      console.log("[Stripe] Created Connect account", account.id, "for driver", decoded.driverId);

      res.json({
        success: true,
        accountId: account.id,
        message: "Stripe Connect account created",
      });
    } catch (error: any) {
      console.error("[Stripe] Create driver account error:", error);
      res.status(500).json({ error: "Failed to create Stripe account", details: error?.message });
    }
  });

  // ==========================================================================
  // DRIVER CONNECT: Create Account Link (onboarding URL)
  // POST /api/stripe/connect/create-account-link
  // ==========================================================================
  app.post("/api/stripe/connect/create-account-link", async (req: Request, res: Response) => {
    try {
      const decoded = verifyDriverToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const stripe = await getStripe();
      if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      const driverResult = await pool.query(
        "SELECT stripe_account_id FROM drivers WHERE id = $1",
        [decoded.driverId]
      );
      if (driverResult.rows.length === 0 || !driverResult.rows[0].stripe_account_id) {
        return res.status(400).json({ error: "No Stripe account found. Create one first." });
      }

      const accountId = driverResult.rows[0].stripe_account_id;

      // Return URL and refresh URL — the frontend will open this in a browser
      const { return_url, refresh_url } = req.body;

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refresh_url || "https://haulkind.com/driver/stripe-refresh",
        return_url: return_url || "https://haulkind.com/driver/stripe-return",
        type: "account_onboarding",
      });

      console.log("[Stripe] Created account link for driver", decoded.driverId);

      res.json({
        success: true,
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
      });
    } catch (error: any) {
      console.error("[Stripe] Create account link error:", error);
      res.status(500).json({ error: "Failed to create account link", details: error?.message });
    }
  });

  // ==========================================================================
  // DRIVER CONNECT: Check Status
  // GET /api/stripe/connect/status
  // ==========================================================================
  app.get("/api/stripe/connect/status", async (req: Request, res: Response) => {
    try {
      const decoded = verifyDriverToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const stripe = await getStripe();
      if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      const driverResult = await pool.query(
        "SELECT stripe_account_id, stripe_onboarding_status, payouts_enabled FROM drivers WHERE id = $1",
        [decoded.driverId]
      );
      if (driverResult.rows.length === 0) {
        return res.status(404).json({ error: "Driver not found" });
      }

      const driver = driverResult.rows[0];

      if (!driver.stripe_account_id) {
        return res.json({
          success: true,
          status: "not_started",
          payoutsEnabled: false,
          detailsSubmitted: false,
          chargesEnabled: false,
        });
      }

      // Fetch account details from Stripe
      const account = await stripe.accounts.retrieve(driver.stripe_account_id);

      let onboardingStatus = "pending";
      if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
        onboardingStatus = "complete";
      } else if (account.requirements?.disabled_reason) {
        onboardingStatus = "restricted";
      }

      const payoutsEnabled = !!(account.details_submitted && account.charges_enabled && account.payouts_enabled);

      // Update DB
      await pool.query(
        `UPDATE drivers SET stripe_onboarding_status = $1, payouts_enabled = $2, updated_at = NOW() WHERE id = $3`,
        [onboardingStatus, payoutsEnabled, decoded.driverId]
      );

      res.json({
        success: true,
        status: onboardingStatus,
        payoutsEnabled,
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        stripPayoutsEnabled: account.payouts_enabled,
        requirements: account.requirements?.currently_due || [],
      });
    } catch (error: any) {
      console.error("[Stripe] Connect status error:", error);
      res.status(500).json({ error: "Failed to check Stripe status", details: error?.message });
    }
  });

  // ==========================================================================
  // CUSTOMER CHECKOUT: Create Stripe Checkout Session
  // POST /api/checkout/create
  // ==========================================================================
  app.post("/api/checkout/create", async (req: Request, res: Response) => {
    try {
      const stripe = await getStripe();
      if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      const { jobId, successUrl, cancelUrl } = req.body;
      if (!jobId) return res.status(400).json({ error: "jobId is required" });

      // Get job details
      const jobResult = await pool.query("SELECT * FROM jobs WHERE id = $1", [jobId]);
      if (jobResult.rows.length === 0) {
        return res.status(404).json({ error: "Job not found" });
      }

      const job = jobResult.rows[0];

      // Calculate amount in cents
      let totalCents = job.price_total_cents;
      if (!totalCents) {
        const price = parseFloat(job.estimated_price) || 0;
        totalCents = Math.round(price * 100);
      }

      if (totalCents < 50) {
        return res.status(400).json({ error: "Order amount too low (minimum $0.50)" });
      }

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Haulkind ${job.service_type || "Haul Away"} Service`,
                description: `Order ${String(job.id).substring(0, 8)} — ${job.pickup_address || "Pickup"}`,
              },
              unit_amount: totalCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl || `https://app.haulkind.com/orders?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `https://app.haulkind.com/orders?payment=cancel`,
        metadata: {
          jobId: job.id,
          customerEmail: job.customer_email || "",
          customerName: job.customer_name || "",
        },
        customer_email: job.customer_email || undefined,
      });

      // Calculate fee breakdown
      const platformFeeCents = Math.round(totalCents * PLATFORM_FEE_RATE);
      const driverEarningsCents = totalCents - platformFeeCents;

      // Update job with checkout info
      await pool.query(
        `UPDATE jobs SET
          stripe_checkout_session_id = $1,
          price_total_cents = $2,
          platform_fee_cents = $3,
          driver_earnings_cents = $4,
          updated_at = NOW()
        WHERE id = $5`,
        [session.id, totalCents, platformFeeCents, driverEarningsCents, job.id]
      );

      console.log("[Stripe] Checkout session created:", session.id, "for job:", job.id, "amount:", totalCents);

      res.json({
        success: true,
        sessionId: session.id,
        url: session.url,
        totalCents,
        platformFeeCents,
        driverEarningsCents,
      });
    } catch (error: any) {
      console.error("[Stripe] Checkout create error:", error);
      res.status(500).json({ error: "Failed to create checkout session", details: error?.message });
    }
  });

  // ==========================================================================
  // STRIPE WEBHOOK
  // POST /api/stripe/webhook
  // NOTE: This endpoint needs raw body for signature verification.
  //       We register it with express.raw() middleware in index.ts.
  // ==========================================================================
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    try {
      const stripe = await getStripe();
      if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

      const sig = req.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: any;

      if (webhookSecret && sig) {
        try {
          event = stripe.webhooks.constructEvent((req as any).rawBody || req.body, sig, webhookSecret);
        } catch (err: any) {
          console.error("[Stripe] Webhook signature verification failed:", err.message);
          return res.status(400).json({ error: "Webhook signature verification failed" });
        }
      } else {
        // No webhook secret configured — use event as-is (dev mode)
        event = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        console.warn("[Stripe] Webhook: no STRIPE_WEBHOOK_SECRET set, skipping signature verification");
      }

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      console.log("[Stripe] Webhook event:", event.type);

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const jobId = session.metadata?.jobId;
          if (!jobId) break;

          // Mark job as paid
          await pool.query(
            `UPDATE jobs SET
              status = 'paid',
              stripe_payment_intent_id = $1,
              paid_at = NOW(),
              payout_status = 'not_eligible',
              updated_at = NOW()
            WHERE id = $2`,
            [session.payment_intent, jobId]
          );

          // Create ledger event
          const jobResult = await pool.query("SELECT price_total_cents, assigned_driver_id FROM jobs WHERE id = $1", [jobId]);
          const job = jobResult.rows[0];
          if (job) {
            await createLedgerEvent(pool, "job_paid", job.assigned_driver_id, jobId, job.price_total_cents || 0, {
              payment_intent: session.payment_intent,
              checkout_session: session.id,
            });
          }

          console.log("[Stripe] Job", jobId, "marked as paid via checkout");
          break;
        }

        case "payment_intent.succeeded": {
          const pi = event.data.object;
          // Find job by payment_intent_id and confirm paid status
          await pool.query(
            `UPDATE jobs SET stripe_payment_intent_id = $1, updated_at = NOW()
             WHERE stripe_payment_intent_id IS NULL
               AND stripe_checkout_session_id IN (
                 SELECT stripe_checkout_session_id FROM jobs WHERE stripe_payment_intent_id = $1 LIMIT 1
               )`,
            [pi.id]
          );
          console.log("[Stripe] PaymentIntent succeeded:", pi.id);
          break;
        }

        case "charge.succeeded": {
          const charge = event.data.object;
          // Capture Stripe fee from balance transaction
          if (charge.balance_transaction && charge.payment_intent) {
            try {
              const bt = await stripe.balanceTransactions.retrieve(charge.balance_transaction);
              const stripeFee = bt.fee || 0; // in cents
              await pool.query(
                `UPDATE jobs SET stripe_charge_id = $1, stripe_fee_cents = $2, updated_at = NOW()
                 WHERE stripe_payment_intent_id = $3`,
                [charge.id, stripeFee, charge.payment_intent]
              );
              
              // Recalculate driver earnings with actual Stripe fee
              // driver_earnings = total - platform_fee - stripe_fee
              await pool.query(
                `UPDATE jobs SET
                  driver_earnings_cents = price_total_cents - platform_fee_cents - $1,
                  updated_at = NOW()
                WHERE stripe_payment_intent_id = $2
                  AND price_total_cents IS NOT NULL
                  AND platform_fee_cents IS NOT NULL`,
                [stripeFee, charge.payment_intent]
              );

              console.log("[Stripe] Captured fee:", stripeFee, "cents for PI:", charge.payment_intent);
            } catch (e) {
              console.warn("[Stripe] Could not fetch balance transaction:", e);
            }
          }
          break;
        }

        case "charge.refunded":
        case "refund.updated": {
          const refundObj = event.type === "charge.refunded" ? event.data.object : event.data.object;
          const piId = refundObj.payment_intent;
          if (piId) {
            // Mark job as refunded
            await pool.query(
              `UPDATE jobs SET status = 'refunded', payout_status = 'not_eligible', updated_at = NOW()
               WHERE stripe_payment_intent_id = $1`,
              [piId]
            );

            const jobResult = await pool.query(
              "SELECT id, assigned_driver_id, price_total_cents FROM jobs WHERE stripe_payment_intent_id = $1",
              [piId]
            );
            const job = jobResult.rows[0];
            if (job) {
              await createLedgerEvent(pool, "job_refund", job.assigned_driver_id, job.id, -(job.price_total_cents || 0), {
                payment_intent: piId,
                reason: "refund",
              });
            }

            console.log("[Stripe] Refund processed for PI:", piId);
          }
          break;
        }

        default:
          console.log("[Stripe] Unhandled webhook event:", event.type);
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error("[Stripe] Webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  // ==========================================================================
  // JOB COMPLETION — mark completed + eligible for payout
  // POST /api/jobs/:id/complete
  // ==========================================================================
  app.post("/api/jobs/:id/complete", async (req: Request, res: Response) => {
    try {
      const decoded = verifyAnyToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      const jobId = req.params.id;

      // Get job details
      const jobResult = await pool.query("SELECT * FROM jobs WHERE id = $1", [jobId]);
      if (jobResult.rows.length === 0) {
        return res.status(404).json({ error: "Job not found" });
      }

      const job = jobResult.rows[0];

      // Check if driver has payouts enabled
      let payoutStatus = "not_eligible";
      if (job.assigned_driver_id && (job.status === "paid" || job.paid_at)) {
        const driverResult = await pool.query(
          "SELECT payouts_enabled FROM drivers WHERE id = $1",
          [job.assigned_driver_id]
        );
        if (driverResult.rows[0]?.payouts_enabled) {
          payoutStatus = "eligible";
        }
      }

      await pool.query(
        `UPDATE jobs SET status = 'completed', completed_at = NOW(), payout_status = $1, updated_at = NOW() WHERE id = $2`,
        [payoutStatus, jobId]
      );

      // Create ledger event
      await createLedgerEvent(pool, "job_completed", job.assigned_driver_id, jobId, job.driver_earnings_cents || 0, {
        payout_status: payoutStatus,
      });

      console.log("[Stripe] Job", jobId, "completed, payout_status:", payoutStatus);

      res.json({ success: true, payoutStatus });
    } catch (error: any) {
      console.error("[Stripe] Job complete error:", error);
      res.status(500).json({ error: "Failed to complete job" });
    }
  });

  // ==========================================================================
  // WEEKLY PAYOUT RUNNER
  // POST /api/payouts/run-weekly
  // ==========================================================================
  app.post("/api/payouts/run-weekly", async (req: Request, res: Response) => {
    try {
      // Allow admin or cron (no auth check for cron — can be secured via secret header)
      const cronSecret = req.headers["x-cron-secret"];
      const decoded = verifyAdminToken(req);
      if (!decoded && cronSecret !== process.env.CRON_SECRET) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const stripe = await getStripe();
      if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      // Period: last Tuesday to this Monday (or configurable)
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setDate(periodEnd.getDate() - periodEnd.getDay() + 1); // Monday
      periodEnd.setHours(23, 59, 59, 999);
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodStart.getDate() - 7); // Previous Tuesday
      periodStart.setHours(0, 0, 0, 0);

      // Find eligible jobs
      const eligibleResult = await pool.query(
        `SELECT j.id, j.assigned_driver_id, j.driver_earnings_cents, j.price_total_cents,
                d.stripe_account_id, d.payouts_enabled, d.name as driver_name
         FROM jobs j
         JOIN drivers d ON d.id::text = j.assigned_driver_id
         WHERE j.payout_status = 'eligible'
           AND j.status = 'completed'
           AND d.payouts_enabled = true
           AND d.stripe_account_id IS NOT NULL
         ORDER BY j.assigned_driver_id, j.completed_at`
      );

      if (eligibleResult.rows.length === 0) {
        return res.json({ success: true, message: "No eligible jobs for payout", processed: 0 });
      }

      // Group by driver
      const driverGroups: Record<string, { driverId: string; stripeAccountId: string; driverName: string; totalCents: number; jobIds: string[] }> = {};
      for (const row of eligibleResult.rows) {
        const key = row.assigned_driver_id;
        if (!driverGroups[key]) {
          driverGroups[key] = {
            driverId: key,
            stripeAccountId: row.stripe_account_id,
            driverName: row.driver_name,
            totalCents: 0,
            jobIds: [],
          };
        }
        driverGroups[key].totalCents += (row.driver_earnings_cents || 0);
        driverGroups[key].jobIds.push(row.id);
      }

      // Create payout record
      const payoutResult = await pool.query(
        `INSERT INTO payouts (period_start, period_end, scheduled_for, status, created_at)
         VALUES ($1, $2, NOW(), 'processing', NOW()) RETURNING id`,
        [periodStart.toISOString().split("T")[0], periodEnd.toISOString().split("T")[0]]
      );
      const payoutId = payoutResult.rows[0].id;

      const results: any[] = [];
      let totalPaid = 0;
      let totalFailed = 0;

      // Process each driver
      for (const [driverId, group] of Object.entries(driverGroups)) {
        if (group.totalCents <= 0) continue;

        // Create payout item
        const itemResult = await pool.query(
          `INSERT INTO payout_items (payout_id, driver_id, amount_cents, status, created_at)
           VALUES ($1, $2, $3, 'pending', NOW()) RETURNING id`,
          [payoutId, driverId, group.totalCents]
        );
        const itemId = itemResult.rows[0].id;

        try {
          // Transfer to driver's Stripe Connect account
          const transfer = await stripe.transfers.create({
            amount: group.totalCents,
            currency: "usd",
            destination: group.stripeAccountId,
            metadata: {
              payout_id: payoutId,
              payout_item_id: itemId,
              driver_id: driverId,
              job_count: String(group.jobIds.length),
            },
          });

          // Update payout item as paid
          await pool.query(
            `UPDATE payout_items SET status = 'paid', stripe_transfer_id = $1 WHERE id = $2`,
            [transfer.id, itemId]
          );

          // Update jobs as paid
          for (const jobId of group.jobIds) {
            await pool.query(
              `UPDATE jobs SET payout_status = 'paid', payout_batch_id = $1, updated_at = NOW() WHERE id = $2`,
              [payoutId, jobId]
            );
          }

          // Ledger event
          await createLedgerEvent(pool, "payout_paid", driverId, null, group.totalCents, {
            payout_id: payoutId,
            transfer_id: transfer.id,
            job_count: group.jobIds.length,
          });

          totalPaid++;
          results.push({ driverId, driverName: group.driverName, amount: group.totalCents, status: "paid", transferId: transfer.id });
          console.log("[Stripe] Transfer", transfer.id, "—", group.totalCents, "cents to driver", driverId);

        } catch (transferErr: any) {
          // Mark as failed
          await pool.query(
            `UPDATE payout_items SET status = 'failed', failure_reason = $1 WHERE id = $2`,
            [transferErr.message || "Transfer failed", itemId]
          );

          await createLedgerEvent(pool, "payout_failed", driverId, null, group.totalCents, {
            payout_id: payoutId,
            error: transferErr.message,
          });

          totalFailed++;
          results.push({ driverId, driverName: group.driverName, amount: group.totalCents, status: "failed", error: transferErr.message });
          console.error("[Stripe] Transfer failed for driver", driverId, ":", transferErr.message);
        }
      }

      // Update payout status
      const finalStatus = totalFailed === 0 ? "paid" : totalPaid > 0 ? "partially_failed" : "failed";
      await pool.query("UPDATE payouts SET status = $1 WHERE id = $2", [finalStatus, payoutId]);

      res.json({
        success: true,
        payoutId,
        status: finalStatus,
        totalDrivers: Object.keys(driverGroups).length,
        totalPaid,
        totalFailed,
        totalAmountCents: Object.values(driverGroups).reduce((sum, g) => sum + g.totalCents, 0),
        results,
      });
    } catch (error: any) {
      console.error("[Stripe] Payout runner error:", error);
      res.status(500).json({ error: "Payout processing failed", details: error?.message });
    }
  });

  // ==========================================================================
  // RETRY FAILED PAYOUT ITEM
  // POST /api/payouts/retry-item/:id
  // ==========================================================================
  app.post("/api/payouts/retry-item/:id", async (req: Request, res: Response) => {
    try {
      const decoded = verifyAdminToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized (admin only)" });

      const stripe = await getStripe();
      if (!stripe) return res.status(503).json({ error: "Stripe not configured" });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      const itemId = req.params.id;

      // Get failed payout item
      const itemResult = await pool.query(
        `SELECT pi.*, d.stripe_account_id, d.payouts_enabled, d.name as driver_name
         FROM payout_items pi
         JOIN drivers d ON d.id::text = pi.driver_id
         WHERE pi.id = $1 AND pi.status = 'failed'`,
        [itemId]
      );

      if (itemResult.rows.length === 0) {
        return res.status(404).json({ error: "Failed payout item not found" });
      }

      const item = itemResult.rows[0];

      if (!item.stripe_account_id || !item.payouts_enabled) {
        return res.status(400).json({ error: "Driver Stripe account not ready" });
      }

      // Retry transfer
      const transfer = await stripe.transfers.create({
        amount: item.amount_cents,
        currency: "usd",
        destination: item.stripe_account_id,
        metadata: {
          payout_id: item.payout_id,
          payout_item_id: itemId,
          driver_id: item.driver_id,
          retry: "true",
        },
      });

      // Update payout item
      await pool.query(
        `UPDATE payout_items SET status = 'paid', stripe_transfer_id = $1, failure_reason = NULL WHERE id = $2`,
        [transfer.id, itemId]
      );

      // Update related jobs
      await pool.query(
        `UPDATE jobs SET payout_status = 'paid', updated_at = NOW()
         WHERE assigned_driver_id = $1 AND payout_status = 'eligible' AND status = 'completed'`,
        [item.driver_id]
      );

      await createLedgerEvent(pool, "payout_paid", item.driver_id, null, item.amount_cents, {
        payout_id: item.payout_id,
        transfer_id: transfer.id,
        retry: true,
      });

      console.log("[Stripe] Retried transfer", transfer.id, "for payout item", itemId);

      res.json({ success: true, transferId: transfer.id });
    } catch (error: any) {
      console.error("[Stripe] Retry payout error:", error);
      res.status(500).json({ error: "Retry failed", details: error?.message });
    }
  });

  // ==========================================================================
  // DRIVER EARNINGS SUMMARY
  // GET /api/driver/earnings-summary
  // ==========================================================================
  app.get("/api/driver/earnings-summary", async (req: Request, res: Response) => {
    try {
      const decoded = verifyDriverToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized" });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      // Total earnings (all time)
      const totalResult = await pool.query(
        `SELECT COALESCE(SUM(driver_earnings_cents), 0) as total_cents,
                COUNT(*) as job_count
         FROM jobs
         WHERE assigned_driver_id = $1 AND status = 'completed' AND driver_earnings_cents IS NOT NULL`,
        [decoded.driverId]
      );

      // This week earnings
      const weekResult = await pool.query(
        `SELECT COALESCE(SUM(driver_earnings_cents), 0) as week_cents,
                COUNT(*) as week_jobs
         FROM jobs
         WHERE assigned_driver_id = $1
           AND status = 'completed'
           AND driver_earnings_cents IS NOT NULL
           AND completed_at >= date_trunc('week', NOW())`,
        [decoded.driverId]
      );

      // Today earnings
      const todayResult = await pool.query(
        `SELECT COALESCE(SUM(driver_earnings_cents), 0) as today_cents,
                COUNT(*) as today_jobs
         FROM jobs
         WHERE assigned_driver_id = $1
           AND status = 'completed'
           AND driver_earnings_cents IS NOT NULL
           AND completed_at::date = CURRENT_DATE`,
        [decoded.driverId]
      );

      // Pending payout (eligible but not yet paid)
      const pendingResult = await pool.query(
        `SELECT COALESCE(SUM(driver_earnings_cents), 0) as pending_cents,
                COUNT(*) as pending_jobs
         FROM jobs
         WHERE assigned_driver_id = $1
           AND payout_status = 'eligible'
           AND driver_earnings_cents IS NOT NULL`,
        [decoded.driverId]
      );

      // Stripe connect status
      const driverResult = await pool.query(
        "SELECT stripe_onboarding_status, payouts_enabled FROM drivers WHERE id = $1",
        [decoded.driverId]
      );
      const driver = driverResult.rows[0] || {};

      res.json({
        success: true,
        totalCents: parseInt(totalResult.rows[0].total_cents),
        totalJobs: parseInt(totalResult.rows[0].job_count),
        weekCents: parseInt(weekResult.rows[0].week_cents),
        weekJobs: parseInt(weekResult.rows[0].week_jobs),
        todayCents: parseInt(todayResult.rows[0].today_cents),
        todayJobs: parseInt(todayResult.rows[0].today_jobs),
        pendingPayoutCents: parseInt(pendingResult.rows[0].pending_cents),
        pendingPayoutJobs: parseInt(pendingResult.rows[0].pending_jobs),
        stripeStatus: driver.stripe_onboarding_status || "not_started",
        payoutsEnabled: driver.payouts_enabled || false,
      });
    } catch (error: any) {
      console.error("[Stripe] Earnings summary error:", error);
      res.status(500).json({ error: "Failed to get earnings" });
    }
  });

  // ==========================================================================
  // ADMIN: List Payouts
  // GET /admin/payouts
  // ==========================================================================
  app.get("/admin/payouts", async (req: Request, res: Response) => {
    try {
      const decoded = verifyAdminToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized (admin only)" });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      const { status, limit = "20", offset = "0" } = req.query;
      let query = `SELECT p.*,
        (SELECT COUNT(*) FROM payout_items WHERE payout_id = p.id) as item_count,
        (SELECT SUM(amount_cents) FROM payout_items WHERE payout_id = p.id) as total_amount_cents,
        (SELECT COUNT(*) FROM payout_items WHERE payout_id = p.id AND status = 'paid') as paid_count,
        (SELECT COUNT(*) FROM payout_items WHERE payout_id = p.id AND status = 'failed') as failed_count
       FROM payouts p WHERE 1=1`;
      const params: any[] = [];
      let idx = 1;

      if (status) {
        query += ` AND p.status = $${idx++}`;
        params.push(status);
      }

      query += ` ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
      params.push(parseInt(limit as string), parseInt(offset as string));

      const result = await pool.query(query, params);
      const countResult = await pool.query("SELECT COUNT(*) as count FROM payouts");

      res.json({
        success: true,
        payouts: result.rows,
        total: parseInt(countResult.rows[0].count),
      });
    } catch (error: any) {
      console.error("[Stripe] Admin payouts error:", error);
      res.status(500).json({ error: "Failed to get payouts" });
    }
  });

  // ==========================================================================
  // ADMIN: Get Payout Details (with items)
  // GET /admin/payouts/:id
  // ==========================================================================
  app.get("/admin/payouts/:id", async (req: Request, res: Response) => {
    try {
      const decoded = verifyAdminToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized (admin only)" });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      const payoutId = req.params.id;

      const payoutResult = await pool.query("SELECT * FROM payouts WHERE id = $1", [payoutId]);
      if (payoutResult.rows.length === 0) {
        return res.status(404).json({ error: "Payout not found" });
      }

      const itemsResult = await pool.query(
        `SELECT pi.*, d.name as driver_name, d.email as driver_email, d.stripe_account_id
         FROM payout_items pi
         JOIN drivers d ON d.id::text = pi.driver_id
         WHERE pi.payout_id = $1
         ORDER BY pi.created_at`,
        [payoutId]
      );

      // Get jobs included in this payout
      const jobsResult = await pool.query(
        `SELECT id, customer_name, service_type, price_total_cents, platform_fee_cents,
                driver_earnings_cents, assigned_driver_id, completed_at
         FROM jobs WHERE payout_batch_id = $1 ORDER BY completed_at`,
        [payoutId]
      );

      res.json({
        success: true,
        payout: payoutResult.rows[0],
        items: itemsResult.rows,
        jobs: jobsResult.rows,
      });
    } catch (error: any) {
      console.error("[Stripe] Payout detail error:", error);
      res.status(500).json({ error: "Failed to get payout details" });
    }
  });

  // ==========================================================================
  // ADMIN: Drivers Stripe Status Summary
  // GET /admin/stripe/drivers-status
  // ==========================================================================
  app.get("/admin/stripe/drivers-status",async (req: Request, res: Response) => {
    try {
      const decoded = verifyAdminToken(req);
      if (!decoded) return res.status(401).json({ error: "Unauthorized (admin only)" });

      const pool = await getPgPool();
      if (!pool) return res.status(500).json({ error: "Database not available" });

      // Check if stripe columns exist first
      const colCheck = await pool.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_name = 'drivers' AND column_name = 'stripe_account_id'`
      );
      if (colCheck.rows.length === 0) {
        return res.json({ success: true, drivers: [], summary: { total: 0, complete: 0, pending: 0, restricted: 0, notStarted: 0 } });
      }

      const result = await pool.query(
        `SELECT id, name, email, stripe_account_id, stripe_onboarding_status, payouts_enabled
         FROM drivers
         WHERE stripe_account_id IS NOT NULL
         ORDER BY name`
      );

      const summary = {
        total: result.rows.length,
        complete: result.rows.filter((d: any) => d.stripe_onboarding_status === "complete").length,
        pending: result.rows.filter((d: any) => d.stripe_onboarding_status === "pending").length,
        restricted: result.rows.filter((d: any) => d.stripe_onboarding_status === "restricted").length,
        notStarted: result.rows.filter((d: any) => !d.stripe_onboarding_status || d.stripe_onboarding_status === "not_started").length,
      };

      res.json({ success: true, drivers: result.rows, summary });
    } catch (error: any) {
      console.error("[Stripe] Drivers stripe status error:", error);
      res.status(500).json({ error: "Failed to get drivers stripe status" });
    }
  });

  // ==========================================================================
  // WEEKLY CRON — Automatically run payouts every Tuesday at 9:00 AM ET
  // ==========================================================================
  let payoutCronStarted = false;
  if (!payoutCronStarted) {
    payoutCronStarted = true;
    // Check every hour if it's Tuesday 9AM ET
    setInterval(async () => {
      try {
        const nowET = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
        const dayOfWeek = nowET.getDay(); // 0=Sun, 2=Tue
        const hour = nowET.getHours();

        // Only run on Tuesday between 9:00-9:59 AM ET
        if (dayOfWeek !== 2 || hour !== 9) return;

        // Check if we already ran today
        const pool = await getPgPool();
        if (!pool) return;

        const todayStr = nowET.toISOString().split("T")[0];
        const existing = await pool.query(
          "SELECT id FROM payouts WHERE scheduled_for::date = $1::date",
          [todayStr]
        );
        if (existing.rows.length > 0) return; // Already ran today

        console.log("[Stripe] Running weekly payout cron...");

        // Self-invoke the payout endpoint logic
        const stripe = await getStripe();
        if (!stripe) return;

        // Reuse payout logic inline
        const eligibleResult = await pool.query(
          `SELECT j.id, j.assigned_driver_id, j.driver_earnings_cents,
                  d.stripe_account_id, d.payouts_enabled, d.name as driver_name
           FROM jobs j
           JOIN drivers d ON d.id::text = j.assigned_driver_id
           WHERE j.payout_status = 'eligible'
             AND j.status = 'completed'
             AND d.payouts_enabled = true
             AND d.stripe_account_id IS NOT NULL`
        );

        if (eligibleResult.rows.length === 0) {
          console.log("[Stripe] Cron: No eligible jobs for payout");
          return;
        }

        // Group by driver
        const groups: Record<string, { stripeAccountId: string; totalCents: number; jobIds: string[] }> = {};
        for (const row of eligibleResult.rows) {
          const key = row.assigned_driver_id;
          if (!groups[key]) {
            groups[key] = { stripeAccountId: row.stripe_account_id, totalCents: 0, jobIds: [] };
          }
          groups[key].totalCents += (row.driver_earnings_cents || 0);
          groups[key].jobIds.push(row.id);
        }

        const periodEnd = new Date(nowET);
        periodEnd.setDate(periodEnd.getDate() - 1);
        const periodStart = new Date(periodEnd);
        periodStart.setDate(periodStart.getDate() - 6);

        const payoutResult = await pool.query(
          `INSERT INTO payouts (period_start, period_end, scheduled_for, status, created_at)
           VALUES ($1, $2, NOW(), 'processing', NOW()) RETURNING id`,
          [periodStart.toISOString().split("T")[0], periodEnd.toISOString().split("T")[0]]
        );
        const payoutId = payoutResult.rows[0].id;

        let paid = 0;
        let failed = 0;
        for (const [driverId, group] of Object.entries(groups)) {
          if (group.totalCents <= 0) continue;
          const itemResult = await pool.query(
            `INSERT INTO payout_items (payout_id, driver_id, amount_cents, status) VALUES ($1, $2, $3, 'pending') RETURNING id`,
            [payoutId, driverId, group.totalCents]
          );
          const itemId = itemResult.rows[0].id;
          try {
            const transfer = await stripe.transfers.create({
              amount: group.totalCents,
              currency: "usd",
              destination: group.stripeAccountId,
              metadata: { payout_id: payoutId, driver_id: driverId },
            });
            await pool.query("UPDATE payout_items SET status = 'paid', stripe_transfer_id = $1 WHERE id = $2", [transfer.id, itemId]);
            for (const jobId of group.jobIds) {
              await pool.query("UPDATE jobs SET payout_status = 'paid', payout_batch_id = $1, updated_at = NOW() WHERE id = $2", [payoutId, jobId]);
            }
            await createLedgerEvent(pool, "payout_paid", driverId, null, group.totalCents, { payout_id: payoutId, transfer_id: transfer.id, cron: true });
            paid++;
          } catch (e: any) {
            await pool.query("UPDATE payout_items SET status = 'failed', failure_reason = $1 WHERE id = $2", [e.message, itemId]);
            await createLedgerEvent(pool, "payout_failed", driverId, null, group.totalCents, { payout_id: payoutId, error: e.message, cron: true });
            failed++;
          }
        }

        const finalStatus = failed === 0 ? "paid" : paid > 0 ? "partially_failed" : "failed";
        await pool.query("UPDATE payouts SET status = $1 WHERE id = $2", [finalStatus, payoutId]);
        console.log("[Stripe] Cron payout complete: paid=" + paid + " failed=" + failed);

      } catch (e) {
        console.error("[Stripe] Cron error:", e);
      }
    }, 60 * 60 * 1000); // Every hour

    console.log("[Stripe] Weekly payout cron registered (Tuesdays 9AM ET)");
  }
}
