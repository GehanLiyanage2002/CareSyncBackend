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

module.exports = router;
