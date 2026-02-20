import { Router } from "express";

export const realtimeRouter = Router();

// Realtime SSE endpoint for driver location updates
realtimeRouter.get("/api/realtime/health", (req, res) => {
  res.json({ ok: true, realtime: "active" });
});

// SSE endpoint for real-time order updates
realtimeRouter.get("/api/realtime/orders", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: "heartbeat", ts: Date.now() })}\n\n`);
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
  });
});
