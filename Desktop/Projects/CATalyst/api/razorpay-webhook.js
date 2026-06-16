// api/razorpay-webhook.js — handles Razorpay webhook events for recurring subscription renewals
// Register this URL in Razorpay Dashboard → Webhooks: https://catalyst-app-six.vercel.app/api/razorpay-webhook
// Events to enable: subscription.charged, subscription.cancelled, subscription.halted

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  // Verify webhook signature
  const signature = req.headers['x-razorpay-signature'];
  const body      = JSON.stringify(req.body);
  const expected  = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expected) {
    console.warn('[webhook] Invalid signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const { event, payload } = req.body;
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (event === 'subscription.charged') {
    // Monthly renewal: extend access by 32 days
    const subscription = payload.subscription.entity;
    const payment      = payload.payment.entity;
    const userId       = subscription.notes?.userId;

    if (!userId) {
      console.error('[webhook] No userId in subscription notes');
      return res.status(200).end(); // ack anyway to stop Razorpay retries
    }

    await sb.from('events').insert({
      event:   'payment_completed',
      user_id: userId,
      metadata: {
        plan:            'monthly',
        payment_id:      payment.id,
        subscription_id: subscription.id,
        expires_at:      Date.now() + 32 * 24 * 60 * 60 * 1000,
      },
    });

  } else if (event === 'subscription.halted' || event === 'subscription.cancelled') {
    // Payment failed or user cancelled — log it; access expires naturally via expires_at
    const subscription = payload.subscription.entity;
    const userId       = subscription.notes?.userId;
    if (userId) {
      await sb.from('events').insert({
        event:   'subscription_cancelled',
        user_id: userId,
        metadata: { subscription_id: subscription.id, reason: event },
      });
    }
  }

  res.status(200).json({ received: true });
};
