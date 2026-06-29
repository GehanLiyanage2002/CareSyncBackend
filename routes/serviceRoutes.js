const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/serviceController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

const upload = require('../middlewares/uploadMiddleware');

// Public routes
router.get('/', ServiceController.getAllServices);
router.get('/:id/image', ServiceController.getServiceImage);

// All following endpoints require authentication
router.use(verifyToken);

// Patient routes
router.post('/book', requireRole(['Patient', 'Receptionist']), ServiceController.bookService);

// Admin routes
router.post('/', requireRole(['Admin']), ServiceController.createService);
router.put('/:id', requireRole(['Admin']), ServiceController.updateService);
router.put('/:id/image', requireRole(['Admin']), upload.single('image'), ServiceController.uploadServiceImage);
router.post('/:id/schedules', requireRole(['Admin']), ServiceController.addServiceSchedule);
router.delete('/:id', requireRole(['Admin']), ServiceController.deleteService);
router.delete('/schedules/:scheduleId', requireRole(['Admin']), ServiceController.deleteServiceSchedule);

// General authenticated routes (available to both Patients and Admins)
router.get('/bookings', ServiceController.getMyBookings);
router.get('/:id/schedules', ServiceController.getServiceSchedules);

module.exports = router;
