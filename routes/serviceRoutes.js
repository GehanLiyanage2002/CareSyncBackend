const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/serviceController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Public routes
router.get('/', ServiceController.getAllServices);

// All following endpoints require authentication
router.use(verifyToken);

// Patient routes
router.post('/book', requireRole(['Patient']), ServiceController.bookService);

// Admin routes
router.post('/', requireRole(['Admin']), ServiceController.createService);
router.put('/:id', requireRole(['Admin']), ServiceController.updateService);
router.post('/:id/schedules', requireRole(['Admin']), ServiceController.addServiceSchedule);
router.delete('/schedules/:scheduleId', requireRole(['Admin']), ServiceController.deleteServiceSchedule);

// General authenticated routes (available to both Patients and Admins)
router.get('/bookings', ServiceController.getMyBookings);
router.get('/:id/schedules', ServiceController.getServiceSchedules);

module.exports = router;
