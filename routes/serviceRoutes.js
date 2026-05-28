const express = require('express');
const router = express.Router();
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

module.exports = router;
