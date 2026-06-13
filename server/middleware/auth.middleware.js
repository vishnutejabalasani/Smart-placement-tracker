const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes: verifies token, loads user payload onto req
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, token is missing'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found'
      });
    }

    if (user.profile && user.profile.phone && user.profile.phone.startsWith('[BANNED]')) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended due to security policy violations.'
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error('JWT validation error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token is invalid or expired'
    });
  }
};

/**
 * Middleware to restrict access based on roles
 * @param {...string} roles - Permitted roles (e.g., 'admin', 'student')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user?.role || 'none'}' is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = {
  protect,
  restrictTo
};
