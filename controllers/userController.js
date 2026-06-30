const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const UserService = require('../services/userService');

class UserController {
  static updatePatientProfile = asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    const result = await UserService.updatePatientProfile(req.user.id, req.user.role, req.body, io);
    res.status(200).json(new ApiResponse(200, result, 'Profile updated successfully'));
  });

  static updateGeneralProfile = asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    const result = await UserService.updateGeneralProfile(req.user.id, req.body, io);
    res.status(200).json(new ApiResponse(200, result, 'General profile updated successfully'));
  });

  static changePassword = asyncHandler(async (req, res) => {
    const result = await UserService.changePassword(req.user.id, req.body);
    res.status(200).json(new ApiResponse(200, result, 'Password updated successfully'));
  });

  static updateDoctorProfile = asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    const result = await UserService.updateDoctorProfile(req.user.id, req.user.role, req.body, io);
    res.status(200).json(new ApiResponse(200, result, 'Doctor profile updated successfully'));
  });

  static getDoctorProfile = asyncHandler(async (req, res) => {
    const result = await UserService.getDoctorProfile(req.user.id, req.user.role);
    res.status(200).json(new ApiResponse(200, result));
  });

  static getAvailableDoctors = asyncHandler(async (req, res) => {
    const result = await UserService.getAvailableDoctors(req.query.date);
    res.status(200).json(new ApiResponse(200, result));
  });

  static updateFaceId = asyncHandler(async (req, res) => {
    const result = await UserService.updateFaceId(req.user.id, req.body);
    res.status(200).json(new ApiResponse(200, result, 'Face ID updated successfully.'));
  });

  static updateProfileImage = asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    const result = await UserService.updateProfileImage(req.user.id, req.file, io);
    res.status(200).json(new ApiResponse(200, result, 'Profile image updated successfully'));
  });

  static getProfileImage = asyncHandler(async (req, res) => {
    const result = await UserService.getProfileImage(req.params.id);
    if (!result) {
      return res.redirect('https://ui-avatars.com/api/?name=User&background=random');
    }
    res.set('Content-Type', result.profile_image_mimetype);
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(result.profile_image);
  });
}

module.exports = UserController;
