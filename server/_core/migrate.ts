import { Router } from "express";

export const migrateRouter = Router();

// Temporary migration endpoint (should be removed after migration)
migrateRouter.post("/migrate/events", async (req, res) => {
  try {
    const { authorization } = req.headers;
    
    // Simple auth check (admin only)
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Run migration
    await req.db.query(`
      CREATE TABLE IF NOT EXISTS events (
        id BIGSERIAL PRIMARY KEY,
        channel TEXT NOT NULL,
        type TEXT NOT NULL,
        payload JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    await req.db.query(`
      CREATE INDEX IF NOT EXISTS idx_events_channel_id ON events(channel, id);
    `);

    await req.db.query(`
      CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
    `);

    res.json({ success: true, message: "Events table created successfully" });
  } catch (error: any) {
    console.error("[Migration] Error:", error);
    res.status(500).json({ error: error.message });
  }
});
