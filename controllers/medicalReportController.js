const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const MedicalReportService = require('../services/MedicalReportService');

class MedicalReportController {
  static createReport = asyncHandler(async (req, res) => {
    const result = await MedicalReportService.createReport(req.user.id, req.body, req.file);
    res.status(201).json(new ApiResponse(201, result, 'Medical report created safely.'));
  });

  static getMyReports = asyncHandler(async (req, res) => {
    const result = await MedicalReportService.getMyReports(req.user.id);
    res.status(200).json(new ApiResponse(200, result));
  });

  static getPatientReports = asyncHandler(async (req, res) => {
    const result = await MedicalReportService.getPatientReports(req.params.patientId);
    res.status(200).json(new ApiResponse(200, result));
  });

  static getReportByAppointment = asyncHandler(async (req, res) => {
    const result = await MedicalReportService.getReportByAppointment(req.params.appointmentId);
    res.status(200).json(new ApiResponse(200, result));
  });

  static updateReport = asyncHandler(async (req, res) => {
    const result = await MedicalReportService.updateReport(req.params.id, req.body, req.file);
    res.status(200).json(new ApiResponse(200, result, 'Medical report updated successfully.'));
  });
}

module.exports = MedicalReportController;
