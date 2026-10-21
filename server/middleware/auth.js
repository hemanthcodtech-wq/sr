const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { mockUsers } = require('../config/mockStore');

// Protect routes: verify JWT in Authorization header
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

      if (mongoose.connection.readyState !== 1) {
        req.user = mockUsers.find((u) => u._id === decoded.id);
        if (!req.user) {
          return res.status(401).json({ success: false, message: 'User not found' });
        }
        return next();
      }

      req.user = await User.findById(decoded.id).populate('store');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists with this token',
        });
      }

      next();
    } catch (err) {
      console.error('JWT Auth Error:', err.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
