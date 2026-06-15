const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

// ── Config ─────────────────────────────────────────────────────
const NOTIFICATIONS_PER_DAY = 4; // cron runs 4x/day: 8am, 1pm, 6pm, 9pm IST
const CAT_DATE = new Date('2026-11-23T00:00:00.000Z');

// ── Notification copy ──────────────────────────────────────────
const staticNotifications = [
  "Your mistakes called. They said you never come back 😭",
  "Bro your error log is giving you silent treatment rn",
  "Studying hard but skipping Fix Mode? That's like filling a bucket with holes bhai",
  "Ek CAT aspirant apni galtiyon ko ignore kar raha hai. Don't be that guy 💀",
  "It's late but your mistakes are wide awake 👁️",
  "Fix 3 mistakes today. That's it. Just 3.",
  "Every mistake you ignore is a mark you'll lose in November.",
  "IIM dreams vs unfixed mistakes. Choose your fighter.",
  "The 99%iler fixed their mistakes today. Did you?",
  "Mock on Sunday. Mistakes still pending. Coincidence? Don't think so.",
];

const dynamicNotifications = [
  "Bhai {mistakes} mistakes hain abhi bhi. Woh galat answers khud fix nahi honge 👀",
  "You got {mistakes} questions wrong. They're still there. Waiting.",
  "CAT is in {days} days. Your {mistakes} mistakes don't care.",
  "{mistakes} mistakes unresolved. Math isn't mathing 🧮",
  "Good morning! {mistakes} pending mistakes won't fix themselves ☕",
  "New day, same {mistakes} pending mistakes. Aaj toh fix kar de yaar",
  "190 days to CAT. {mistakes} mistakes unresolved. Coincidence? Don't think so.",
  "It's {day}. Your {mistakes} mistakes are still pending from last session.",
  "The 99%iler fixed their mistakes. You still have {mistakes} pending.",
  "CAT mein {days} din bache hain. {mistakes} mistakes abhi bhi pending hain bhai 💀",
];

const zeroMistakesNotifications = [
  "No pending mistakes. Solve some questions and break that streak 😈",
  "Error log is clean. Dangerous. Go make some mistakes and fix them 🎯",
  "0 pending mistakes. Either you're a genius or you haven't practiced today 👀",
];

// ── Helpers ────────────────────────────────────────────────────
function getDaysToCAT() {
  return Math.max(0, Math.ceil((CAT_DATE - new Date()) / 86400000));
}

function getDayOfWeek() {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
}

// Pick a random index from arr, avoiding lastIndex if the type matches
function pickIndex(arr, lastType, lastIndex, currentType) {
  const exclude = lastType === currentType ? lastIndex : -1;
  const pool = arr.map((_, i) => i).filter(i => i !== exclude);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Handler ────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Verify Vercel Cron secret (set CRON_SECRET in Vercel env vars)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers['authorization'];
    if (!auth || auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const { VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

  if (!VAPID_EMAIL || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing required environment variables' });
  }

  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('*');

  if (subError) {
    return res.status(500).json({ error: 'Failed to fetch subscriptions', detail: subError.message });
  }

  if (!subscriptions || subscriptions.length === 0) {
    return res.status(200).json({ sent: 0, skipped: 0, deleted: 0, message: 'No subscribers yet' });
  }

  const days = getDaysToCAT();
  const day  = getDayOfWeek();
  const results = { sent: 0, skipped: 0, failed: 0, deleted: 0 };

  for (const sub of subscriptions) {
    try {
      // Skip if sent too recently — enforce minimum gap between notifications
      // Gap = 24h / NOTIFICATIONS_PER_DAY * 0.75 (buffer so cron timing jitter doesn't double-send)
      const MIN_GAP_MS = (24 / NOTIFICATIONS_PER_DAY) * 3600000 * 0.75;
      if (sub.last_notification_sent) {
        const elapsed = Date.now() - new Date(sub.last_notification_sent).getTime();
        if (elapsed < MIN_GAP_MS) {
          results.skipped++;
          continue;
        }
      }

      // Fetch pending mistake count for this user
      const { count } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', sub.user_id)
        .eq('reattempt_status', false);

      const mistakes = count || 0;

      let body, chosenType, chosenIndex;

      if (mistakes === 0) {
        chosenType  = 'zero';
        chosenIndex = pickIndex(zeroMistakesNotifications, sub.last_notification_type, sub.last_notification_index, 'zero');
        body        = zeroMistakesNotifications[chosenIndex];
      } else {
        chosenType  = Math.random() > 0.5 ? 'dynamic' : 'static';
        const arr   = chosenType === 'dynamic' ? dynamicNotifications : staticNotifications;
        chosenIndex = pickIndex(arr, sub.last_notification_type, sub.last_notification_index, chosenType);
        body        = arr[chosenIndex]
          .replace(/{mistakes}/g, mistakes)
          .replace(/{days}/g,    days)
          .replace(/{day}/g,     day);
      }

      const url = mistakes > 0
        ? 'https://catalyst-app-six.vercel.app/#fix'
        : 'https://catalyst-app-six.vercel.app/';

      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: 'CATalyst ⚡', body, icon: '/icon-192.png', badge: '/icon-192.png', url }),
        { TTL: 86400 }
      );

      await supabase.from('push_subscriptions').update({
        last_notification_sent:  new Date().toISOString(),
        last_notification_type:  chosenType,
        last_notification_index: chosenIndex,
      }).eq('id', sub.id);

      results.sent++;
    } catch (err) {
      // 410 Gone / 404 = subscription expired or unsubscribed — clean it up
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        results.deleted++;
      } else {
        console.error(`[push] Failed for user ${sub.user_id}:`, err.message);
        results.failed++;
      }
    }
  }

  return res.status(200).json(results);
};
