const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

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

// Route to get list of available doctors (Public or token depending on needs, we make it public so users can see doctors before login? Let's make it public)
router.get('/doctors', UserController.getAvailableDoctors);

// Route to register/update Face ID
router.put('/face-id', verifyToken, UserController.updateFaceId);

// Route to update profile image
router.put('/profile-image', verifyToken, upload.single('image'), UserController.updateProfileImage);

// Route to get profile image (Public)
router.get('/profile-image/:id', UserController.getProfileImage);

module.exports = router;
