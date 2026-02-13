-- Create events table for polling-based real-time updates
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  channel TEXT NOT NULL,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient polling queries
CREATE INDEX IF NOT EXISTS idx_events_channel_id ON events(channel, id);

-- Index for cleanup queries (optional, for removing old events)
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
