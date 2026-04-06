const express = require('express');
const stripe = require('../config/stripe');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const Class = require('../models/Class');
const router = express.Router();

// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', auth, async (req, res) => {
  try {
    const { classId } = req.body;
    const danceClass = await Class.findById(classId).populate('teacher');
    if (!danceClass) return res.status(404).json({ error: 'Class not found' });
    if (danceClass.enrolled >= danceClass.capacity) {
      return res.status(400).json({ error: 'Class is full' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: danceClass.title,
            description: `${danceClass.style} class with ${danceClass.teacher?.name || 'TBA'}`,
          },
          unit_amount: Math.round(danceClass.price * 100),
        },
        quantity: 1,
      }],
      metadata: { classId, userId: req.user._id.toString() },
      success_url: `${process.env.CLIENT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout/cancel`,
    });

    await Booking.create({
      user: req.user._id,
      class: classId,
      stripeSessionId: session.id,
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await Booking.findOneAndUpdate(
      { stripeSessionId: session.id },
      { paymentStatus: 'paid' }
    );
    await Class.findByIdAndUpdate(session.metadata.classId, { $inc: { enrolled: 1 } });
  }

  res.json({ received: true });
});

module.exports = router;
