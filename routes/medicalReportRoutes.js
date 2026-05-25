const express = require('express');
const router = express.Router();
const MedicalReportController = require('../controllers/medicalReportController');
const upload = require('../middlewares/uploadMiddleware');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// POST /api/reports
// Create a new report with an attachment
router.post(
  '/',
  verifyToken,
  requireRole(['Doctor']),
  upload.single('attachment'),
  MedicalReportController.createReport
);

// GET /api/reports/patient/:patientId
// Get all reports for a patient
router.get(
  '/patient/:patientId',
  verifyToken,
  MedicalReportController.getPatientReports
);

module.exports = router;
