const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const DoctorService = require('../services/DoctorService');
const UserService = require('../services/userService');

exports.getProfile = asyncHandler(async (req, res) => {
  const result = await DoctorService.getProfile(req.user.id);
  res.status(200).json(new ApiResponse(200, result));
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await DoctorService.updateProfile(req.user.id, req.body, io);
  UserService.clearDoctorsCache();
  res.status(200).json(new ApiResponse(200, result, 'Profile updated successfully'));
});

exports.updateFee = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await DoctorService.updateFee(req.user.id, req.body.fee, io);
  UserService.clearDoctorsCache();
  res.status(200).json(new ApiResponse(200, result, 'Consultation fee updated successfully'));
});

exports.getAppointments = asyncHandler(async (req, res) => {
  const result = await DoctorService.getAppointments(req.user.id, req.query.filter);
  res.status(200).json(new ApiResponse(200, result));
});

exports.getPatientProfile = asyncHandler(async (req, res) => {
  const result = await DoctorService.getPatientProfile(req.params.id);
  res.status(200).json(new ApiResponse(200, result));
});

exports.updateAppointmentStatus = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  const result = await DoctorService.updateAppointmentStatus(req.params.id, req.user.id, req.body.status, io);
  res.status(200).json(new ApiResponse(200, result));
});

exports.getSchedule = asyncHandler(async (req, res) => {
  const result = await DoctorService.getSchedule(req.user.id);
  res.status(200).json(new ApiResponse(200, result));
});

exports.updateSchedule = asyncHandler(async (req, res) => {
  const result = await DoctorService.updateSchedule(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, result, 'Schedule updated successfully'));
});

exports.deleteSchedule = asyncHandler(async (req, res) => {
  const result = await DoctorService.deleteSchedule(req.user.id, req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Schedule deleted successfully'));
});
