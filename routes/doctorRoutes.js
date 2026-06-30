const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctorController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Protect all doctor routes
router.use(verifyToken);

// Profile routes
router.get('/profile', DoctorController.getProfile);
router.put('/profile', DoctorController.updateProfile);
router.put('/fee', DoctorController.updateFee);

// Appointments routes
router.get('/appointments', DoctorController.getAppointments);
router.put('/appointments/:id/status', DoctorController.updateAppointmentStatus);

// Patient routes
router.get('/patient/:id/profile', DoctorController.getPatientProfile);

// Schedule routes
router.get('/schedule', DoctorController.getSchedule);
router.post('/schedule', DoctorController.updateSchedule);
router.delete('/schedule/:id', DoctorController.deleteSchedule);

module.exports = router;
