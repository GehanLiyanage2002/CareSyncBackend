const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ReceptionistService = require('../services/receptionistService');

const ReceptionistController = {
  registerWalkInPatient: asyncHandler(async (req, res) => {
    const io = req.app.get('io');
    const result = await ReceptionistService.registerWalkInPatient(req.body, io);
    return res.status(result.isNew ? 201 : 200).json(
      new ApiResponse(result.isNew ? 201 : 200, { patient: result.patient }, 
      result.isNew ? 'Walk-in patient registered successfully' : 'Existing patient updated successfully')
    );
  }),

  searchPatients: asyncHandler(async (req, res) => {
    const result = await ReceptionistService.searchPatients(req.query.q);
    return res.status(200).json(new ApiResponse(200, result));
  }),

  getAllPatients: asyncHandler(async (req, res) => {
    const result = await ReceptionistService.getAllPatients();
    return res.status(200).json(new ApiResponse(200, result));
  }),

  getAllQueues: asyncHandler(async (req, res) => {
    const result = await ReceptionistService.getAllQueues();
    return res.status(200).json(new ApiResponse(200, result));
  }),

  getQueueDashboard: asyncHandler(async (req, res) => {
    const result = await ReceptionistService.getQueueDashboard(req.params.doctorId);
    return res.status(200).json(new ApiResponse(200, result));
  }),

  getActiveQueue: asyncHandler(async (req, res) => {
    const result = await ReceptionistService.getActiveQueue(req.params.doctorId);
    return res.status(200).json(new ApiResponse(200, result));
  }),

  checkInPatient: asyncHandler(async (req, res) => {
    const io = req.app.get('io');
    const result = await ReceptionistService.checkInPatient(req.params.appointmentId, io);
    return res.status(200).json(new ApiResponse(200, result, 'Patient checked in successfully.'));
  })
};

module.exports = ReceptionistController;
