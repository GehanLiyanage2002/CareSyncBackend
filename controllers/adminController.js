const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const AdminService = require('../services/AdminService');

class AdminController {
  static getStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const stats = await AdminService.getStats(startDate, endDate);
    res.status(200).json(new ApiResponse(200, { stats }));
  });

  static getDoctors = asyncHandler(async (req, res) => {
    const doctors = await AdminService.getDoctors();
    res.status(200).json(new ApiResponse(200, { doctors }));
  });

  static getDoctorIdCard = asyncHandler(async (req, res) => {
    const { id, side } = req.params;
    const image = await AdminService.getDoctorIdCard(id, side);
    res.set('Content-Type', image.mimetype);
    res.send(image.buffer);
  });

  static toggleDoctorApproval = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { is_approved } = req.body;
    const result = await AdminService.toggleDoctorApproval(id, is_approved);
    res.status(200).json(new ApiResponse(200, result, `Doctor ${is_approved ? 'approved' : 'suspended'} successfully.`));
  });

  static getPatients = asyncHandler(async (req, res) => {
    const patients = await AdminService.getPatients();
    res.status(200).json(new ApiResponse(200, { patients }));
  });

  static getPatientAppointments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const appointments = await AdminService.getPatientAppointments(id);
    res.status(200).json(new ApiResponse(200, { appointments }));
  });

  static getAppointments = asyncHandler(async (req, res) => {
    const appointments = await AdminService.getAppointments();
    res.status(200).json(new ApiResponse(200, { appointments }));
  });

  static cancelAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const appointment = await AdminService.cancelAppointment(id);
    res.status(200).json(new ApiResponse(200, { appointment }, 'Appointment cancelled successfully.'));
  });

  static getEarnings = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const earnings = await AdminService.getEarnings(startDate, endDate);
    res.status(200).json(new ApiResponse(200, { earnings }));
  });

  static createDoctor = asyncHandler(async (req, res) => {
    const doctor = await AdminService.createDoctor(req.body);
    res.status(201).json(new ApiResponse(201, { doctor }, 'Doctor account created successfully.'));
  });

  static updateDoctorSchedule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const schedule = await AdminService.updateDoctorSchedule(id, req.body);
    res.status(200).json(new ApiResponse(200, { schedule }, 'Schedule updated.'));
  });

  static updateDoctorFee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { fee } = req.body;
    await AdminService.updateDoctorFee(id, fee);
    res.status(200).json(new ApiResponse(200, {}, 'Consultation fee updated.'));
  });

  static updateDoctorProfileImage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const fileData = req.file ? req.file.buffer : null;
    const fileMimeType = req.file ? req.file.mimetype : null;
    const result = await AdminService.updateDoctorProfileImage(id, fileData, fileMimeType);
    res.status(200).json(new ApiResponse(200, result, 'Doctor profile image updated.'));
  });

  static deleteDoctor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await AdminService.deleteDoctor(id);
    res.status(200).json(new ApiResponse(200, {}, 'Doctor removed completely.'));
  });
}

module.exports = AdminController;
