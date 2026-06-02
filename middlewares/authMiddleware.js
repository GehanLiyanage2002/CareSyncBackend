const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies the Bearer token in the Authorization header
 */
const verifyToken = (req, res, next) => {
  let token;

  // Check for authorization header and confirm it starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (Bearer <token>)
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user from payload to request object
      req.user = decoded;

      return next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      res.status(401);
      return next(new Error('Not authorized, token failed'));
    }
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, no token provided'));
  }
};

/**
 * Role-based Authorization Middleware
 * @param {Array} roles - Array of allowed roles (e.g. ['Admin', 'Doctor'])
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    // req.user should be populated by verifyToken
    if (!req.user || !req.user.role) {
      res.status(401);
      return next(new Error('Not authorized, user data missing'));
    }

    // Check if the user's role is included in the allowed roles array
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error('Forbidden: You do not have the required permissions'));
    }

    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
};
