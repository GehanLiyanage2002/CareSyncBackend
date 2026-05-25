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

// Route to get available slots for a doctor
router.get(
  '/slots/:doctorId',
  AppointmentController.getAvailableSlots
);

// Route to create a new appointment
router.post(
  '/',
  verifyToken,
  requireRole(['Patient']),
  AppointmentController.createAppointment
);

module.exports = router;
