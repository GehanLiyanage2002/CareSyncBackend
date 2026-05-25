const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route to update a patient's medical profile
router.put('/profile', verifyToken, UserController.updatePatientProfile);

// Route to update general profile (name, contact)
router.put('/general', verifyToken, UserController.updateGeneralProfile);

// Route to change password
router.put('/password', verifyToken, UserController.changePassword);

// Route to get doctor profile
router.get('/doctor-profile', verifyToken, UserController.getDoctorProfile);

// Route to update doctor profile
router.put('/doctor-profile', verifyToken, UserController.updateDoctorProfile);

module.exports = router;
