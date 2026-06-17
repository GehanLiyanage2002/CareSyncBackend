const xss = require('xss');

/**
 * Sanitizes input to prevent XSS attacks.
 */
const sanitize = (input) => {
  if (typeof input !== 'string') return input;
  // xss() strips dangerous HTML tags and scripts
  return xss(input.trim());
};

/**
 * Validates email format.
 */
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validates mobile number format.
 */
const isValidMobile = (mobile) => {
  const re = /^[0-9+\-\s]{7,15}$/;
  return re.test(mobile);
};

/**
 * Sanitizes all top-level string values in an object.
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = sanitize(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  return sanitized;
};

module.exports = {
  sanitize,
  isValidEmail,
  isValidMobile,
  sanitizeObject
};
