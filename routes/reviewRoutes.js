const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Patient submits a review
router.post(
  '/',
  verifyToken,
  requireRole(['Patient']),
  ReviewController.createReview
);

// Get all reviews for a doctor (public)
router.get('/:doctorId', ReviewController.getDoctorReviews);

// Check if patient already reviewed an appointment
router.get(
  '/my-review/:appointmentId',
  verifyToken,
  requireRole(['Patient']),
  ReviewController.getMyReview
);

module.exports = router;
