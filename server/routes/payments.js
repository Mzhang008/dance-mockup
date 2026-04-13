const express = require('express');
const crypto = require('crypto');
const { body } = require('express-validator');
const mongoose = require('mongoose');
const { squareClient, locationId } = require('../config/square');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/error');
const Booking = require('../models/Booking');
const Class = require('../models/Class');
const logger = require('../config/logger');

const router = express.Router();

// Serialize BigInt fields returned by Square SDK
const toJSON = (obj) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

// POST /api/payments/process-payment
router.post(
  '/process-payment',
  auth,
  [
    body('sourceId').isString().isLength({ min: 1, max: 500 }),
    body('classId').custom((v) => mongoose.isValidObjectId(v)).withMessage('Invalid classId'),
    body('idempotencyKey').optional().isString().isLength({ min: 1, max: 128 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { sourceId, classId } = req.body;

    // Atomic seat reservation: only succeeds if a seat is available
    const reserved = await Class.findOneAndUpdate(
      {
        _id: classId,
        active: true,
        $expr: { $lt: ['$enrolled', '$capacity'] },
      },
      { $inc: { enrolled: 1 } },
      { new: true }
    ).populate('teacher');

    if (!reserved) {
      const exists = await Class.exists({ _id: classId });
      return res
        .status(exists ? 400 : 404)
        .json({ error: exists ? 'Class is full' : 'Class not found' });
    }

    // Server is the source of truth for price
    const booking = await Booking.create({
      user: req.user._id,
      class: classId,
      paymentStatus: 'pending',
    });

    try {
      const idempotencyKey = req.body.idempotencyKey || crypto.randomUUID();
      const { result } = await squareClient.paymentsApi.createPayment({
        sourceId,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(Math.round(reserved.price * 100)),
          currency: 'USD',
        },
        locationId,
        referenceId: booking._id.toString(),
        buyerEmailAddress: req.user.email,
      });

      const status = result.payment?.status;
      if (status === 'COMPLETED' || status === 'APPROVED') {
        booking.paymentStatus = 'paid';
        booking.squarePaymentId = result.payment.id;
        await booking.save();
        logger.info({ bookingId: booking._id, paymentId: result.payment.id }, 'payment ok');
        return res.json({ success: true, payment: toJSON(result.payment) });
      }

      // Roll back the reserved seat
      await Class.findByIdAndUpdate(classId, { $inc: { enrolled: -1 } });
      booking.paymentStatus = 'failed';
      await booking.save();
      return res.status(402).json({ error: 'Payment not completed' });
    } catch (err) {
      // Roll back the reserved seat on any failure
      await Class.findByIdAndUpdate(classId, { $inc: { enrolled: -1 } });
      booking.paymentStatus = 'failed';
      await booking.save();
      const detail = err?.errors?.[0]?.detail || 'Payment processing error';
      logger.error({ err, bookingId: booking._id }, 'payment failed');
      return res.status(502).json({ error: detail });
    }
  })
);

// POST /api/payments/webhook  — verifies Square webhook signature
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const signature = req.headers['x-square-hmacsha256-signature'];
    const notificationUrl = `${process.env.SERVER_URL}/api/payments/webhook`;
    const signingKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;

    if (!signature || !signingKey) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    const hmac = crypto
      .createHmac('sha256', signingKey)
      .update(notificationUrl + req.body.toString('utf8'))
      .digest('base64');

    const valid =
      hmac.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));

    if (!valid) {
      logger.warn('square webhook signature mismatch');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString('utf8'));
    logger.info({ type: event.type }, 'square webhook');

    if (event.type === 'refund.created' || event.type === 'refund.updated') {
      const refund = event.data?.object?.refund;
      const paymentId = refund?.payment_id;
      if (paymentId) {
        const booking = await Booking.findOne({ squarePaymentId: paymentId });
        if (booking && booking.paymentStatus !== 'refunded') {
          booking.paymentStatus = 'refunded';
          await booking.save();
          await Class.findByIdAndUpdate(booking.class, { $inc: { enrolled: -1 } });
        }
      }
    }

    res.json({ received: true });
  })
);

module.exports = router;
