-- Run once in Supabase SQL Editor (prod project) to enable push notifications.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  endpoint                text NOT NULL,
  p256dh                  text NOT NULL,
  auth                    text NOT NULL,
  last_notification_sent  timestamptz,
  last_notification_type  text,             -- 'static' | 'dynamic' | 'zero'
  last_notification_index int DEFAULT -1,   -- index within last type's array
  created_at              timestamptz DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own subscriptions
CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast per-user lookup
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions(user_id);
