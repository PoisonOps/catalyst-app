// api/verify-payment.js — verifies Razorpay signature and activates user in Supabase
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    razorpay_order_id, razorpay_payment_id, razorpay_signature,
    razorpay_subscription_id,
    plan, userId,
  } = req.body || {};

  if (!razorpay_payment_id || !razorpay_signature || !plan || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Signature payload differs: order uses order_id, subscription uses subscription_id
  const sigPayload = razorpay_subscription_id
    ? `${razorpay_payment_id}|${razorpay_subscription_id}`
    : `${razorpay_order_id}|${razorpay_payment_id}`;

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sigPayload)
    .digest('hex');

  if (expected !== razorpay_signature) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  // Activate user in Supabase
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const metadata = {
    plan,
    payment_id: razorpay_payment_id,
    order_id:   razorpay_order_id,
    ...(plan === 'monthly' && {
      expires_at: Date.now() + 32 * 24 * 60 * 60 * 1000, // 32 days
    }),
  };

  const { error } = await sb.from('events').insert({
    event:    'payment_completed',
    user_id:  userId,
    metadata,
  });

  if (error) {
    console.error('[verify-payment] Supabase insert failed:', error);
    return res.status(500).json({ error: 'Activation failed' });
  }

  res.json({ success: true, plan });
};
