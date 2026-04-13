const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  // Prefer httpOnly cookie; fall back to Authorization header
  const token =
    req.cookies?.token ||
    req.header('Authorization')?.replace('Bearer ', '');

  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: 'User not found' });
    if (decoded.tv !== user.tokenVersion) {
      return res.status(401).json({ error: 'Token revoked' });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

module.exports = auth;
module.exports.requireAdmin = requireAdmin;
