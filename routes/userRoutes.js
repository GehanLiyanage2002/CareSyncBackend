const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route to update a patient's medical profile
router.put('/profile', verifyToken, UserController.updatePatientProfile);

module.exports = router;
