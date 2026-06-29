const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const PaymentService = require('../services/PaymentService');

exports.generateHash = asyncHandler(async (req, res) => {
    const result = await PaymentService.generateHash(req.body);
    res.status(200).json(new ApiResponse(200, result));
});
