const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/responseHelper');

// Protect route - verify JWT
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 401, 'Not authorized. Please login first.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return errorResponse(res, 401, 'User not found.');
    }

    next();
  } catch (error) {
    return errorResponse(res, 401, 'Invalid or expired token.');
  }
};

// Role-based access control
// Usage: authorize('admin', 'owner')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Access denied. Required role: ${roles.join(' or ')}`
      );
    }
    next();
  };
};

module.exports = { protect, authorize };
