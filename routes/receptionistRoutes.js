const express = require('express');
const router = express.Router();
const ReceptionistController = require('../controllers/receptionistController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Protect all routes with verifyToken and require Receptionist role
router.use(verifyToken, requireRole(['Receptionist']));

// Register a walk-in patient
router.post('/register-patient', ReceptionistController.registerWalkInPatient);

// Search for existing patients
router.get('/search-patients', ReceptionistController.searchPatients);

// Get all queues for all doctors
router.get('/all-queues', ReceptionistController.getAllQueues);

// Get queue dashboard for a doctor
router.get('/queue-dashboard/:doctorId', ReceptionistController.getQueueDashboard);

// Get specific doctor's active queue
router.get('/queue/:doctorId', ReceptionistController.getActiveQueue);

// Check in a patient
router.post('/check-in/:appointmentId', ReceptionistController.checkInPatient);

module.exports = router;
