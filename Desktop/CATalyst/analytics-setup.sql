-- CATalyst Analytics — run once in Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run

-- 1. Events table
CREATE TABLE IF NOT EXISTS events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event      text        NOT NULL,
  user_id    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata   jsonb       DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_event_idx      ON events (event);
CREATE INDEX IF NOT EXISTS events_created_at_idx ON events (created_at);
CREATE INDEX IF NOT EXISTS events_user_id_idx    ON events (user_id);

-- 2. Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- App can insert events (including anonymous/demo sessions)
CREATE POLICY "events_insert" ON events
  FOR INSERT WITH CHECK (true);

-- Anyone can read (dashboard uses anon key — keep the analytics URL private)
CREATE POLICY "events_select" ON events
  FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────
-- HOW TO MARK A USER AS PAID (after WhatsApp payment confirmation)
-- ─────────────────────────────────────────────────────────────
-- Step 1: find the user's UUID
--   SELECT id, email FROM auth.users WHERE email = 'user@example.com';
--
-- Step 2: insert the payment event
--   INSERT INTO events (event, user_id)
--   VALUES ('payment_completed', '<paste-uuid-here>');
