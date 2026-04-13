const express = require('express');
const crypto = require('crypto');
const { body, param } = require('express-validator');
const mongoose = require('mongoose');
const { squareClient, locationId } = require('../config/square');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/error');
const Package = require('../models/Package');
const UserPackage = require('../models/UserPackage');
const logger = require('../config/logger');

const router = express.Router();

const toJSON = (obj) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)));

// GET /api/packages — list public packages for purchase
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const packages = await Package.find({ active: true }).sort({ price: 1 });
    res.json(packages);
  })
);

// GET /api/packages/me — list current user's owned packages
router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    // Auto-expire memberships whose expiresAt has passed
    await UserPackage.updateMany(
      { user: req.user._id, type: 'membership', status: 'active', expiresAt: { $lte: new Date() } },
      { status: 'expired' }
    );

    const owned = await UserPackage.find({ user: req.user._id })
      .populate('package')
      .sort({ purchasedAt: -1 });
    res.json(owned);
  })
);

// POST /api/packages/:id/purchase — buy a package via Square
router.post(
  '/:id/purchase',
  auth,
  [
    param('id').custom((v) => mongoose.isValidObjectId(v)),
    body('sourceId').isString().isLength({ min: 1, max: 500 }),
    body('idempotencyKey').optional().isString().isLength({ min: 1, max: 128 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const pkg = await Package.findOne({ _id: req.params.id, active: true });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const idempotencyKey = req.body.idempotencyKey || crypto.randomUUID();

    let payment;
    try {
      const { result } = await squareClient.paymentsApi.createPayment({
        sourceId: req.body.sourceId,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(Math.round(pkg.price * 100)),
          currency: 'USD',
        },
        locationId,
        referenceId: `pkg:${pkg._id}`,
        buyerEmailAddress: req.user.email,
      });
      payment = result.payment;
    } catch (err) {
      const detail = err?.errors?.[0]?.detail || 'Payment processing error';
      logger.error({ err, packageId: pkg._id }, 'package purchase failed');
      return res.status(502).json({ error: detail });
    }

    if (payment?.status !== 'COMPLETED' && payment?.status !== 'APPROVED') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    const userPackage = await UserPackage.create({
      user: req.user._id,
      package: pkg._id,
      type: pkg.type,
      creditsRemaining: pkg.type === 'punchcard' ? pkg.credits : 0,
      expiresAt:
        pkg.type === 'membership'
          ? new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000)
          : undefined,
      squarePaymentId: payment.id,
    });

    logger.info({ userId: req.user._id, packageId: pkg._id }, 'package purchased');
    res.status(201).json({ userPackage, payment: toJSON(payment) });
  })
);

module.exports = router;
