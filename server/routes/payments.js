const express = require('express');
const crypto = require('crypto');
const { squareClient, locationId } = require('../config/square');
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');
const Class = require('../models/Class');
const router = express.Router();

// Serialize BigInt fields returned by Square SDK
const toJSON = (obj) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

// POST /api/payments/process-payment
router.post('/process-payment', auth, async (req, res) => {
  try {
    const { sourceId, classId } = req.body;
    if (!sourceId || !classId) {
      return res.status(400).json({ error: 'sourceId and classId required' });
    }

    const danceClass = await Class.findById(classId).populate('teacher');
    if (!danceClass) return res.status(404).json({ error: 'Class not found' });
    if (danceClass.enrolled >= danceClass.capacity) {
      return res.status(400).json({ error: 'Class is full' });
    }

    const booking = await Booking.create({
      user: req.user._id,
      class: classId,
      paymentStatus: 'pending',
    });

    const { result } = await squareClient.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: crypto.randomUUID(),
      amountMoney: {
        amount: BigInt(Math.round(danceClass.price * 100)),
        currency: 'USD',
      },
      locationId,
      note: `${danceClass.title} — ${req.user.email}`,
      referenceId: booking._id.toString(),
      buyerEmailAddress: req.user.email,
    });

    const status = result.payment?.status;
    if (status === 'COMPLETED' || status === 'APPROVED') {
      booking.paymentStatus = 'paid';
      booking.squarePaymentId = result.payment.id;
      await booking.save();
      await Class.findByIdAndUpdate(classId, { $inc: { enrolled: 1 } });
      return res.json({ success: true, payment: toJSON(result.payment) });
    }

    booking.paymentStatus = 'failed';
    await booking.save();
    res.status(402).json({ error: 'Payment not completed', payment: toJSON(result.payment) });
  } catch (err) {
    const detail = err?.errors?.[0]?.detail || err.message;
    res.status(500).json({ error: detail });
  }
});

module.exports = router;
