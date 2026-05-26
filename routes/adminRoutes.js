const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Middleware to restrict access to Admins only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403);
    next(new Error('Not authorized as an admin'));
  }
};

// All routes require authentication and admin role
router.use(verifyToken);
router.use(adminOnly);

router.get('/stats', AdminController.getStats);
router.get('/doctors', AdminController.getDoctors);
router.put('/doctors/:id/approve', AdminController.toggleDoctorApproval);
router.get('/patients', AdminController.getPatients);
router.get('/appointments', AdminController.getAppointments);
router.get('/earnings', AdminController.getEarnings);

module.exports = router;
