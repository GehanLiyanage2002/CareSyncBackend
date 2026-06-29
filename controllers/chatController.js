const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ChatService = require('../services/ChatService');

exports.handleChat = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const result = await ChatService.handleChat(message);
  res.status(200).json(new ApiResponse(200, result));
});
