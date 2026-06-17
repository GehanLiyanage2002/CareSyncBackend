const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const TelemedicineService = require('../services/telemedicineService');

class TelemedicineController {
  static getToken = asyncHandler(async (req, res) => {
    const result = await TelemedicineService.getToken(req.user.id, req.body.appointmentId);
    res.status(200).json(new ApiResponse(200, result));
  });

  static endCall = asyncHandler(async (req, res) => {
    const io = req.app?.get('io');
    const result = await TelemedicineService.endCall(req.user.role, req.body.appointmentId, io);
    res.status(200).json(new ApiResponse(200, result));
  });
}

module.exports = TelemedicineController;
