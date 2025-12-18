const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // normalize user payload shape - support both id and _id
    const userId = payload.id || payload.sub || payload.user?.id;
    req.user = {
      id: userId,
      _id: userId, // for MongoDB compatibility
      email: payload.email || payload.user?.email,
      name: payload.name || payload.user?.name,
      role: payload.role || payload.user?.role,
    };
    console.log("✅ Auth Middleware - User authenticated:", {
      id: req.user.id,
      _id: req.user._id,
      email: req.user.email,
      role: req.user.role
    });
    next();
  } catch (err) {
    console.error("❌ Auth Middleware - Token error:", err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

exports.adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
};
