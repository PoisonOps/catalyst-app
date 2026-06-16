// api/create-subscription.js — creates a Razorpay recurring subscription for ₹99/month Pro plan
const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const rzp = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const subscription = await rzp.subscriptions.create({
      plan_id:         process.env.RAZORPAY_MONTHLY_PLAN_ID, // set in Vercel env vars
      total_count:     12,   // max 12 months (till CAT 2026); user can cancel anytime
      quantity:        1,
      notes:           { userId },
    });

    res.json({
      subscription_id: subscription.id,
      key_id:          process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[create-subscription]', err);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};
