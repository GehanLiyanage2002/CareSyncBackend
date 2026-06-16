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

// Route to get patient's own appointments
router.get(
  '/patient/my-appointments',
  verifyToken,
  requireRole(['Patient']),
  AppointmentController.getPatientAppointments
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

// Route to get configured dates for a doctor
router.get(
  '/configured-dates/:doctorId',
  AppointmentController.getConfiguredDates
);

// Route to create a new appointment
router.post(
  '/',
  verifyToken,
  requireRole(['Patient', 'Doctor', 'Receptionist']),
  AppointmentController.createAppointment
);

// Route to reschedule an appointment
router.put(
  '/:id/reschedule',
  verifyToken,
  requireRole(['Patient']),
  AppointmentController.rescheduleAppointment
);

// Route to cancel an appointment
router.put(
  '/:id/cancel',
  verifyToken,
  requireRole(['Patient']),
  AppointmentController.cancelAppointment
);

module.exports = router;
