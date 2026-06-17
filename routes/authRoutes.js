const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const upload = require('../middlewares/uploadMiddleware');

// POST /api/auth/register
router.post('/register', upload.fields([
  { name: 'id_card_front', maxCount: 1 },
  { name: 'id_card_rear', maxCount: 1 }
]), AuthController.registerUser);

// POST /api/auth/login
router.post('/login', AuthController.loginUser);

// POST /api/auth/verify-otp
router.post('/verify-otp', AuthController.verifyOTP);

// POST /api/auth/login-face
router.post('/login-face', AuthController.loginFace);

module.exports = router;
