const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { verifyToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

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
router.post('/doctors', AdminController.createDoctor);
router.put('/doctors/:id/approve', AdminController.toggleDoctorApproval);
router.put('/doctors/:id/schedule', AdminController.updateDoctorSchedule);
router.put('/doctors/:id/fee', AdminController.updateDoctorFee);
router.put('/doctors/:id/profile-image', upload.single('image'), AdminController.updateDoctorProfileImage);
router.get('/patients', AdminController.getPatients);
router.get('/patients/:id/appointments', AdminController.getPatientAppointments);
router.get('/appointments', AdminController.getAppointments);
router.put('/appointments/:id/cancel', AdminController.cancelAppointment);
router.get('/earnings', AdminController.getEarnings);

router.delete('/doctors/:id', AdminController.deleteDoctor);

module.exports = router;
