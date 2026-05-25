const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Route to toggle doctor availability
router.put(
  '/doctor/availability', 
  verifyToken, 
  requireRole(['Doctor']), 
  AppointmentController.toggleAvailability
);

// Route to get doctor's appointments
router.get(
  '/doctor/my-appointments', 
  verifyToken, 
  requireRole(['Doctor']), 
  AppointmentController.getDoctorAppointments
);

module.exports = router;
