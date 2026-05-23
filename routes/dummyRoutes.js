const express = require('express');
const router = express.Router();
const DummyController = require('../controllers/dummyController');
const { protect } = require('../middlewares/authMiddleware');

// Public route to check server & database status
router.get('/status', DummyController.getDbStatus);

// Public route to fetch items (with fallback mock if DB is down)
router.get('/items', DummyController.getDummyItems);

// Public route demonstrating password hashing and JWT token generation
router.post('/auth-demo', DummyController.demoAuth);

// Protected route demonstrating JWT authentication middleware verification
router.get('/protected-route', protect, DummyController.getProtectedRoute);

module.exports = router;
