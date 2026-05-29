const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const { 
  getServices, 
  addService, 
  updateService, 
  bookService, 
  getPatientBookings 
} = require('../controllers/serviceController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Get all services (Public or authenticated)
router.get('/', getServices);

// Admin only routes
router.post('/', verifyToken, requireRole(['Admin']), addService);
router.put('/:id', verifyToken, requireRole(['Admin']), updateService);

// Patient routes
router.post('/book', verifyToken, requireRole(['Patient']), bookService);
router.get('/bookings', verifyToken, requireRole(['Patient']), getPatientBookings);
=======
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
>>>>>>> dev

module.exports = router;
