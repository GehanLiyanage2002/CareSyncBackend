const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const AuthService = require('../services/AuthService');

class AuthController {
  static registerUser = asyncHandler(async (req, res) => {
    const io = req.app.get('io');
    const userResponse = await AuthService.registerUser(req.body, req.files, io);
    res.status(200).json(new ApiResponse(200, { user: userResponse }, 'User registered successfully. Please check your email for the verification code.'));
  });

  static loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.loginUser(email, password);
    const { message, ...data } = result;
    res.status(200).json(new ApiResponse(200, data, message));
  });

  static verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const result = await AuthService.verifyOTP(email, otp);
    res.status(200).json(new ApiResponse(200, result, 'OTP verified successfully. Login complete.'));
  });

  static forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await AuthService.forgotPassword(email);
    res.status(200).json(new ApiResponse(200, result, result.message));
  });

  static resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const result = await AuthService.resetPassword(email, otp, newPassword);
    res.status(200).json(new ApiResponse(200, result, result.message));
  });

  static loginFace = asyncHandler(async (req, res) => {
    const { faceDescriptor } = req.body;
    const result = await AuthService.loginFace(faceDescriptor);
    res.status(200).json(new ApiResponse(200, result, 'Face Login successful'));
  });
}

module.exports = AuthController;
