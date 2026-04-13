const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { asyncHandler } = require('../middleware/error');
const logger = require('../config/logger');

const router = express.Router();

const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000;

const signToken = (user) =>
  jwt.sign(
    { id: user._id, tv: user.tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

const sendAuth = (res, user, status = 200) => {
  const token = signToken(user);
  res
    .status(status)
    .cookie('token', token, cookieOpts)
    .json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('name').isString().trim().isLength({ min: 1, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 10, max: 200 }),
    body('phone').optional().isString().trim().isLength({ max: 30 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, phone });
    logger.info({ userId: user._id }, 'user signup');
    sendAuth(res, user, 201);
  })
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 1, max: 200 }),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.isLocked()) {
      return res.status(423).json({ error: 'Account locked. Try again later.' });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= MAX_FAILED) {
        user.lockUntil = new Date(Date.now() + LOCK_MS);
        user.failedLoginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
    logger.info({ userId: user._id }, 'user login');
    sendAuth(res, user);
  })
);

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' }).json({ ok: true });
});

module.exports = router;
