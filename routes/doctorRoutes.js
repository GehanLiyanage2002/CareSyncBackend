const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctorController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Protect all doctor routes
router.use(verifyToken);

// Profile routes
router.get('/profile', DoctorController.getProfile);
router.put('/profile', DoctorController.updateProfile);

// Appointments routes
router.get('/appointments', DoctorController.getAppointments);
router.put('/appointments/:id/status', DoctorController.updateAppointmentStatus);

module.exports = router;
