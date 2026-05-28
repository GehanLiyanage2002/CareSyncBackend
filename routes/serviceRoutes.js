const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/serviceController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// All services endpoints require authentication
router.use(verifyToken);

// Patient routes
router.post('/book', requireRole(['Patient']), ServiceController.bookService);

// Admin routes
router.post('/', requireRole(['Admin']), ServiceController.createService);
router.put('/:id', requireRole(['Admin']), ServiceController.updateService);

// General authenticated routes (available to both Patients and Admins)
router.get('/', ServiceController.getAllServices);
router.get('/bookings', ServiceController.getMyBookings);

module.exports = router;
