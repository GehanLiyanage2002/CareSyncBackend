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

// Patient views all their submitted reviews
router.get(
  '/patient/my-reviews',
  verifyToken,
  requireRole(['Patient']),
  ReviewController.getPatientReviews
);

// Doctor marks all their reviews as read
router.put(
  '/mark-read',
  verifyToken,
  requireRole(['Doctor']),
  ReviewController.markReviewsRead
);

// Check if patient already reviewed an appointment
router.get(
  '/my-review/:appointmentId',
  verifyToken,
  requireRole(['Patient']),
  ReviewController.getMyReview
);

// Get recent reviews for landing page
router.get('/public/recent', ReviewController.getRecentPublicReviews);

// Get all reviews for a doctor (public)
router.get('/:doctorId', ReviewController.getDoctorReviews);

module.exports = router;
