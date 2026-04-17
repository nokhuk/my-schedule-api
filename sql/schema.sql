-- ============================================
-- Life Scheduler API — Supabase Schema
-- ============================================

-- Enable uuid extension (Supabase enables this by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Events table
-- ============================================
CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  datetime      TIMESTAMPTZ NOT NULL,
  remind_before_minutes INTEGER NOT NULL DEFAULT 15,
  repeat_type   VARCHAR(20) DEFAULT 'none'
                CHECK (repeat_type IN ('none', 'daily', 'weekly', 'monthly')),
  reminded      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast reminder queries (cron checks every minute)
CREATE INDEX idx_events_datetime ON events (datetime);
CREATE INDEX idx_events_reminded ON events (reminded, datetime);

-- ============================================
-- Reminder log (track sent notifications)
-- ============================================
CREATE TABLE reminder_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id      UUID REFERENCES events(id) ON DELETE CASCADE,
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  status        VARCHAR(20) DEFAULT 'sent'
                CHECK (status IN ('sent', 'failed')),
  response_text TEXT
);

CREATE INDEX idx_reminder_logs_event ON reminder_logs (event_id);

-- ============================================
-- Auto-update updated_at on row change
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
