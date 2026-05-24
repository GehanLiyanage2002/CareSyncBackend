const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', AuthController.registerUser);

// POST /api/auth/login
router.post('/login', AuthController.loginUser);

// POST /api/auth/verify-otp
router.post('/verify-otp', AuthController.verifyOTP);

module.exports = router;
