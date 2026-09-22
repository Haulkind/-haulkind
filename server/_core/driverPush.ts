import { createHash, createPrivateKey, sign } from "node:crypto";
import type { Express, Request } from "express";
import type { Pool, PoolClient } from "pg";
import webpush from "web-push";

type Database = Pool | PoolClient;
interface AlertOrder {
  id: string;
  estimated_price: string | null;
  pickup_address: string | null;
}
interface Device {
  id: string;
  driver_id: string;
  platform: "web" | "android";
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
  sound: boolean;
  vibration: boolean;
}
interface FirebaseAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}
interface AlertPayload {
  driverId: string;
  eventIds: string[];
  orderId: string;
  title: string;
  body: string;
  url: string;
  sound: boolean;
  vibration: boolean;
}

const availableOrdersSql = `
  SELECT j.id::text, j.estimated_price, j.pickup_address
  FROM jobs j JOIN drivers d ON d.id::text = $1
  LEFT JOIN LATERAL (
    SELECT lat, lng FROM driver_locations
    WHERE driver_id::text = d.id::text ORDER BY updated_at DESC LIMIT 1
  ) location ON true
  WHERE d.is_online = true AND d.is_active IS DISTINCT FROM false
    AND (LOWER(d.status) IN ('approved', 'available', 'active') OR LOWER(d.driver_status) = 'approved')
    AND j.status IN ('pending', 'dispatching', 'paid', 'scheduled')
    AND j.assigned_driver_id IS NULL
    AND (location.lat IS NULL OR location.lng IS NULL OR j.pickup_lat IS NULL OR j.pickup_lng IS NULL
      OR 3958.8 * 2 * ASIN(SQRT(LEAST(1.0,
        POWER(SIN(RADIANS(j.pickup_lat::float8 - location.lat::float8) / 2), 2)
        + COS(RADIANS(location.lat::float8)) * COS(RADIANS(j.pickup_lat::float8))
        * POWER(SIN(RADIANS(j.pickup_lng::float8 - location.lng::float8) / 2), 2)))) <= 80)
  ORDER BY j.created_at DESC LIMIT 50`;

function firebaseAccount(): FirebaseAccount | null {
  try {
    const value: unknown = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "null");
    if (!value || typeof value !== "object" ||
        !("project_id" in value) || typeof value.project_id !== "string" ||
        !("client_email" in value) || typeof value.client_email !== "string" ||
        !("private_key" in value) || typeof value.private_key !== "string") return null;
    return { project_id: value.project_id, client_email: value.client_email, private_key: value.private_key };
  } catch {
    return null;
  }
}

function firebaseConfig() {
  const account = firebaseAccount();
  const appId = process.env.FIREBASE_ANDROID_APP_ID;
  const apiKey = process.env.FIREBASE_ANDROID_API_KEY;
  const senderId = process.env.FIREBASE_SENDER_ID;
  return account && appId && apiKey && senderId
    ? { projectId: account.project_id, appId, apiKey, senderId }
    : null;
}

let accessToken: { value: string; expiresAt: number } | null = null;
async function firebaseAccessToken(account: FirebaseAccount) {
  if (accessToken && accessToken.expiresAt > Date.now() + 60000) return accessToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");
  const unsigned = `${header}.${claims}`;
  const signature = sign("RSA-SHA256", Buffer.from(unsigned), createPrivateKey(account.private_key)).toString("base64url");
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data: { access_token?: string; expires_in?: number } = await response.json();
  if (!response.ok || !data.access_token) throw new Error("Firebase authentication failed");
  accessToken = { value: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return accessToken.value;
}

function deviceId(platform: string, endpoint: string) {
  return createHash("sha256").update(`${platform}:${endpoint}`).digest("hex");
}

function seenEvents(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 1000 ||
      !value.every(item => typeof item === "string" && item.length <= 160)) return null;
  return value;
}

function validWebEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:" && !url.username && !url.password && !url.port &&
      (url.hostname === "fcm.googleapis.com" ||
       url.hostname === "updates.push.services.mozilla.com" ||
       url.hostname.endsWith(".push.services.mozilla.com") ||
       url.hostname === "web.push.apple.com" ||
       url.hostname.endsWith(".notify.windows.com"));
  } catch {
    return false;
  }
}

function payload(driverId: string, orders: AlertOrder[], sound = true, vibration = true): AlertPayload {
  const first = orders[0];
  const price = (Number(first.estimated_price || 0) * 0.7).toFixed(2);
  return {
    driverId,
    eventIds: orders.map(order => `available:${order.id}`),
    orderId: first.id,
    title: orders.length === 1 ? "New order available" : `${orders.length} new orders available`,
    body: `$${price} · ${(first.pickup_address || "Open Haulkind Driver for details").slice(0, 160)}`,
    url: `/orders/${encodeURIComponent(first.id)}`,
    sound,
    vibration,
  };
}

export function registerDriverPushRoutes(
  app: Express,
  getPool: () => Promise<Pool | null>,
  verify: (req: Request) => { driverId: string | number } | null,
) {
  let setup: Promise<{ publicKey: string; privateKey: string }> | null = null;
  function initialize(pool: Pool) {
    if (!setup) {
      setup = (async () => {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS driver_push_keys (
            id INTEGER PRIMARY KEY CHECK (id = 1), public_key TEXT NOT NULL, private_key TEXT NOT NULL
          );
          CREATE TABLE IF NOT EXISTS driver_push_devices (
            id TEXT PRIMARY KEY, driver_id TEXT NOT NULL, platform TEXT NOT NULL,
            endpoint TEXT NOT NULL, p256dh TEXT, auth TEXT, sound BOOLEAN NOT NULL DEFAULT true,
            vibration BOOLEAN NOT NULL DEFAULT true, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS driver_push_devices_driver_idx ON driver_push_devices(driver_id);
          CREATE TABLE IF NOT EXISTS driver_push_deliveries (
            device_id TEXT NOT NULL REFERENCES driver_push_devices(id) ON DELETE CASCADE,
            event_id TEXT NOT NULL, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY(device_id, event_id)
          )`);
        const keys = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
          ? { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY }
          : webpush.generateVAPIDKeys();
        await pool.query(
          "INSERT INTO driver_push_keys(id, public_key, private_key) VALUES(1, $1, $2) ON CONFLICT DO NOTHING",
          [keys.publicKey, keys.privateKey],
        );
        const saved = await pool.query<{ public_key: string; private_key: string }>(
          "SELECT public_key, private_key FROM driver_push_keys WHERE id = 1",
        );
        return { publicKey: saved.rows[0].public_key, privateKey: saved.rows[0].private_key };
      })().catch(error => { setup = null; throw error; });
    }
    return setup;
  }

  app.use("/driver/push", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    const driver = verify(req);
    if (!driver) return res.status(401).json({ error: "Unauthorized" });
    res.locals.pushDriverId = String(driver.driverId);
    next();
  });

  app.get("/driver/push/config", async (_req, res) => {
    try {
      const pool = await getPool();
      if (!pool) return res.status(503).json({ error: "Database unavailable" });
      const keys = await initialize(pool);
      res.json({ vapidPublicKey: keys.publicKey, firebase: firebaseConfig() });
    } catch {
      res.status(503).json({ error: "Notification setup unavailable" });
    }
  });

  app.post("/driver/push/inbox", async (req, res) => {
    try {
      const seen = seenEvents(req.body.seen);
      if (!seen) return res.status(400).json({ error: "Invalid alert history" });
      const pool = await getPool();
      if (!pool) return res.status(503).json({ error: "Database unavailable" });
      const orders = await pool.query<AlertOrder>(availableOrdersSql, [res.locals.pushDriverId]);
      const known = new Set(seen);
      const fresh = orders.rows.filter(order => !known.has(`available:${order.id}`));
      res.json({ alert: fresh.length ? payload(res.locals.pushDriverId, fresh) : null });
    } catch {
      res.status(503).json({ error: "Order alerts unavailable" });
    }
  });

  app.post("/driver/push/subscribe", async (req, res) => {
    try {
      const { platform, endpoint, keys, sound, vibration } = req.body;
      const seen = seenEvents(req.body.seen);
      if (!seen || !["web", "android"].includes(platform) || typeof endpoint !== "string" ||
          endpoint.length < 16 || endpoint.length > 4096 ||
          (platform === "web" && (!validWebEndpoint(endpoint) ||
            typeof keys?.p256dh !== "string" || !/^[A-Za-z0-9_-]{87}=?$/.test(keys.p256dh) ||
            typeof keys?.auth !== "string" || !/^[A-Za-z0-9_-]{22}={0,2}$/.test(keys.auth))) ||
          (platform === "android" && !/^[A-Za-z0-9_:-]+$/.test(endpoint))) {
        return res.status(400).json({ error: "Invalid notification subscription" });
      }
      if (platform === "android" && !firebaseConfig()) {
        return res.status(503).json({ error: "Android background notifications need Firebase configuration" });
      }
      const pool = await getPool();
      if (!pool) return res.status(503).json({ error: "Database unavailable" });
      await initialize(pool);
      const id = deviceId(platform, endpoint);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          "DELETE FROM driver_push_devices WHERE id = $1 AND driver_id <> $2",
          [id, res.locals.pushDriverId],
        );
        await client.query(
          `INSERT INTO driver_push_devices(id, driver_id, platform, endpoint, p256dh, auth, sound, vibration)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT(id) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
             sound = EXCLUDED.sound, vibration = EXCLUDED.vibration, updated_at = NOW(),
             next_attempt_at = NOW()`,
          [id, res.locals.pushDriverId, platform, endpoint, keys?.p256dh || null, keys?.auth || null,
            sound !== false, vibration !== false],
        );
        await client.query(
          `INSERT INTO driver_push_deliveries(device_id, event_id)
           SELECT $1, unnest($2::text[]) ON CONFLICT DO NOTHING`, [id, seen],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
      res.json({ success: true });
    } catch {
      res.status(503).json({ error: "Could not save notification subscription" });
    }
  });

  app.post("/driver/push/unsubscribe", async (req, res) => {
    try {
      const { platform, endpoint } = req.body;
      if (typeof endpoint !== "string" || !["web", "android"].includes(platform)) {
        return res.status(400).json({ error: "Invalid subscription" });
      }
      const pool = await getPool();
      if (!pool) return res.status(503).json({ error: "Database unavailable" });
      await initialize(pool);
      await pool.query("DELETE FROM driver_push_devices WHERE id = $1 AND driver_id = $2",
        [deviceId(platform, endpoint), res.locals.pushDriverId]);
      res.json({ success: true });
    } catch {
      res.status(503).json({ error: "Could not remove subscription" });
    }
  });

  async function send(device: Device, alert: AlertPayload, keys: { publicKey: string; privateKey: string }) {
    if (device.platform === "web") {
      try {
        await webpush.sendNotification({
          endpoint: device.endpoint,
          keys: { p256dh: device.p256dh!, auth: device.auth! },
        }, JSON.stringify(alert), {
          TTL: 120,
          urgency: "high",
          timeout: 10000,
          vapidDetails: { subject: "mailto:support@haulkind.com", ...keys },
        });
        return "sent";
      } catch (error) {
        if (error instanceof webpush.WebPushError && [404, 410].includes(error.statusCode)) return "expired";
        throw new Error("Web Push delivery failed");
      }
    }
    const account = firebaseAccount();
    if (!account) throw new Error("Firebase is not configured");
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(account.project_id)}/messages:send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await firebaseAccessToken(account)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token: device.endpoint,
          data: { alert: JSON.stringify(alert) },
          android: { priority: "high", ttl: "120s", restricted_package_name: "com.haulkinddrivernative" },
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (response.ok) return "sent";
    const result: { error?: { details?: { errorCode?: string }[] } } = await response.json();
    if (result.error?.details?.some(detail => detail.errorCode === "UNREGISTERED")) return "expired";
    throw new Error(`Firebase delivery failed (${response.status})`);
  }

  async function deliver(db: Database, device: Device, keys: { publicKey: string; privateKey: string }) {
    const orders = await db.query<AlertOrder>(availableOrdersSql, [device.driver_id]);
    if (!orders.rows.length) return;
    const delivered = await db.query<{ event_id: string }>(
      "SELECT event_id FROM driver_push_deliveries WHERE device_id = $1 AND event_id = ANY($2::text[])",
      [device.id, orders.rows.map(order => `available:${order.id}`)],
    );
    const seen = new Set(delivered.rows.map(row => row.event_id));
    const fresh = orders.rows.filter(order => !seen.has(`available:${order.id}`)).slice(0, 20);
    if (!fresh.length) return;
    const alert = payload(device.driver_id, fresh, device.sound, device.vibration);
    const result = await send(device, alert, keys);
    if (result === "expired") {
      await db.query("DELETE FROM driver_push_devices WHERE id = $1", [device.id]);
      return;
    }
    await db.query(
      `INSERT INTO driver_push_deliveries(device_id, event_id)
       SELECT $1, unnest($2::text[]) ON CONFLICT DO NOTHING`,
      [device.id, alert.eventIds],
    );
  }

  async function dispatch() {
    try {
      const pool = await getPool();
      if (!pool) return;
      const keys = await initialize(pool);
      const client = await pool.connect();
      let locked = false;
      try {
        const lock = await client.query<{ locked: boolean }>("SELECT pg_try_advisory_lock(724106) AS locked");
        locked = lock.rows[0].locked;
        if (!locked) return;
        const devices = await client.query<Device>(
          `SELECT p.* FROM driver_push_devices p JOIN drivers d ON d.id::text = p.driver_id
           WHERE d.is_online = true AND p.next_attempt_at <= NOW()
             AND p.updated_at > NOW() - INTERVAL '90 days'
           ORDER BY p.next_attempt_at LIMIT 100`,
        );
        for (const device of devices.rows) {
          try {
            await deliver(client, device, keys);
            await client.query("UPDATE driver_push_devices SET next_attempt_at = NOW() + INTERVAL '15 seconds' WHERE id = $1", [device.id]);
          } catch {
            await client.query("UPDATE driver_push_devices SET next_attempt_at = NOW() + INTERVAL '1 minute' WHERE id = $1", [device.id]);
            console.warn("[DriverPush] Delivery deferred", device.platform);
          }
        }
        await client.query("DELETE FROM driver_push_devices WHERE updated_at < NOW() - INTERVAL '90 days'");
      } finally {
        try {
          if (locked) await client.query("SELECT pg_advisory_unlock(724106)");
        } finally {
          client.release();
        }
      }
    } catch {
      console.warn("[DriverPush] Dispatcher unavailable; will retry");
    } finally {
      setTimeout(dispatch, 15000).unref();
    }
  }
  setTimeout(dispatch, 15000).unref();
}
