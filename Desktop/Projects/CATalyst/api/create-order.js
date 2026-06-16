// api/create-order.js — creates a Razorpay one-time order for ₹489 Pro plan
const Razorpay = require('razorpay');

const PLANS = {
  onetime: { amount: 48900, label: 'CATalyst Pro — Till CAT 2026' }, // paise
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { plan, userId } = req.body || {};
  if (!plan || !PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });
  if (!userId) return res.status(400).json({ error: 'userId required' });

  const rzp = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const order = await rzp.orders.create({
      amount:   PLANS[plan].amount,
      currency: 'INR',
      receipt:  `cat_${userId.slice(0, 8)}_${Date.now()}`,
      notes:    { plan, userId },
    });

    res.json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      key_id:   process.env.RAZORPAY_KEY_ID,
      plan,
    });
  } catch (err) {
    console.error('[create-order]', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};
