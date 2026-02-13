import { Router } from "express";
import type { Pool } from "pg";

export const realtimeRouter = Router();

/**
 * Emit an event to a channel (replaces socket.emit)
 * @param db PostgreSQL pool
 * @param channel Channel name (e.g., "driver:123", "customer:456", "admins", "all_drivers")
 * @param type Event type (e.g., "job_offer", "job_update", "location_update")
 * @param payload Event data (any JSON-serializable object)
 */
export async function emitEvent(
  db: Pool,
  channel: string,
  type: string,
  payload: any
): Promise<void> {
  await db.query(
    "INSERT INTO events (channel, type, payload) VALUES ($1, $2, $3)",
    [channel, type, JSON.stringify(payload)]
  );
}

/**
 * Short polling endpoint - returns immediately with available events
 * GET /updates?channel=driver:123&since=0
 */
realtimeRouter.get("/updates", async (req, res) => {
  try {
    const channel = String(req.query.channel || "");
    const since = Number(req.query.since || 0);

    if (!channel) {
      return res.status(400).json({ error: "channel parameter is required" });
    }

    const { rows } = await req.db.query(
      `SELECT id, type, payload, created_at
       FROM events
       WHERE channel = $1 AND id > $2
       ORDER BY id ASC
       LIMIT 200`,
      [channel, since]
    );

    const lastEventId = rows.length ? rows[rows.length - 1].id : since;

    res.json({
      channel,
      since,
      lastEventId,
      events: rows.map((row: any) => ({
        id: row.id,
        type: row.type,
        payload: row.payload,
        createdAt: row.created_at
      }))
    });
  } catch (error: any) {
    console.error("[Realtime] Error in /updates:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Long polling endpoint - waits up to 25s for new events
 * GET /updates/long?channel=driver:123&since=0
 */
realtimeRouter.get("/updates/long", async (req, res) => {
  try {
    const channel = String(req.query.channel || "");
    let since = Number(req.query.since || 0);

    if (!channel) {
      return res.status(400).json({ error: "channel parameter is required" });
    }

    const deadline = Date.now() + 25000; // 25 seconds timeout

    while (Date.now() < deadline) {
      const { rows } = await req.db.query(
        `SELECT id, type, payload, created_at
         FROM events
         WHERE channel = $1 AND id > $2
         ORDER BY id ASC
         LIMIT 200`,
        [channel, since]
      );

      if (rows.length > 0) {
        const lastEventId = rows[rows.length - 1].id;
        return res.json({
          channel,
          since,
          lastEventId,
          events: rows.map((row: any) => ({
            id: row.id,
            type: row.type,
            payload: row.payload,
            createdAt: row.created_at
          }))
        });
      }

      // Wait 1.2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // Timeout - return empty response
    res.json({
      channel,
      since,
      lastEventId: since,
      events: []
    });
  } catch (error: any) {
    console.error("[Realtime] Error in /updates/long:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper functions that replace Socket.io functionality

/**
 * Send job offer to a specific driver
 */
export async function sendJobOfferToDriver(
  db: Pool,
  driverId: string,
  jobData: any
): Promise<void> {
  await emitEvent(db, `driver:${driverId}`, "job_offer", jobData);
}

/**
 * Broadcast job to all online drivers
 */
export async function broadcastJobToAllDrivers(
  db: Pool,
  jobData: any
): Promise<void> {
  await emitEvent(db, "all_drivers", "job_broadcast", jobData);
}

/**
 * Send job update to customer
 */
export async function sendJobUpdateToCustomer(
  db: Pool,
  customerId: string,
  jobData: any
): Promise<void> {
  await emitEvent(db, `customer:${customerId}`, "job_update", jobData);
}

/**
 * Broadcast job update to all participants (customer + assigned driver)
 */
export async function broadcastJobUpdate(
  db: Pool,
  jobId: string,
  customerId: string,
  driverId: string | null,
  update: any
): Promise<void> {
  // Send to customer
  await emitEvent(db, `customer:${customerId}`, "job_update", { jobId, ...update });
  
  // Send to driver if assigned
  if (driverId) {
    await emitEvent(db, `driver:${driverId}`, "job_update", { jobId, ...update });
  }
  
  // Send to admins
  await emitEvent(db, "admins", "job_update", { jobId, customerId, driverId, ...update });
}

/**
 * Send driver location update to customer
 */
export async function sendDriverLocationToCustomer(
  db: Pool,
  customerId: string,
  location: { lat: number; lng: number; driverId: string }
): Promise<void> {
  await emitEvent(db, `customer:${customerId}`, "driver_location", location);
}

/**
 * Notify all admins
 */
export async function notifyAdmins(
  db: Pool,
  eventType: string,
  data: any
): Promise<void> {
  await emitEvent(db, "admins", eventType, data);
}

/**
 * Send chat message
 */
export async function sendChatMessage(
  db: Pool,
  recipientChannel: string,
  message: any
): Promise<void> {
  await emitEvent(db, recipientChannel, "chat_message", message);
}

console.log("[Realtime] Polling-based realtime module initialized");
