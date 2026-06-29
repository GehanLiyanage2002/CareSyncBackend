const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const AccessibilityService = require('../services/AccessibilityService');

exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await AccessibilityService.getSettings(req.user.id);
  res.status(200).json(new ApiResponse(200, { settings }));
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await AccessibilityService.updateSettings(req.user.id, req.body);
  res.status(200).json(new ApiResponse(200, { settings }, 'Settings saved to cloud'));
});
