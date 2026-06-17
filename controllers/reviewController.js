const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ReviewService = require('../services/reviewService');

class ReviewController {
  static createReview = asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    const result = await ReviewService.createReview(req.user.id, req.body, io);
    res.status(201).json(new ApiResponse(201, result));
  });

  static getDoctorReviews = asyncHandler(async (req, res) => {
    const result = await ReviewService.getDoctorReviews(req.params.doctorId);
    res.status(200).json(new ApiResponse(200, result));
  });

  static getRecentPublicReviews = asyncHandler(async (req, res) => {
    const result = await ReviewService.getRecentPublicReviews();
    res.status(200).json(new ApiResponse(200, result));
  });

  static getMyReview = asyncHandler(async (req, res) => {
    const result = await ReviewService.getMyReview(req.user.id, req.params.appointmentId);
    res.status(200).json(new ApiResponse(200, result));
  });

  static getPatientReviews = asyncHandler(async (req, res) => {
    const result = await ReviewService.getPatientReviews(req.user.id);
    res.status(200).json(new ApiResponse(200, result));
  });

  static markReviewsRead = asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    const result = await ReviewService.markReviewsRead(req.user.id, io);
    res.status(200).json(new ApiResponse(200, result));
  });
}

module.exports = ReviewController;
