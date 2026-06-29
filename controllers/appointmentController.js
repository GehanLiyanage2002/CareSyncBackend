const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const AppointmentService = require('../services/AppointmentService');

class AppointmentController {
  static toggleAvailability = asyncHandler(async (req, res) => {
    const doctorId = req.user.id;
    const io = req.app.get('io');
    const result = await AppointmentService.toggleAvailability(doctorId, io);
    res.status(200).json(new ApiResponse(200, result, 'Availability updated successfully'));
  });

  static getPatientAppointments = asyncHandler(async (req, res) => {
    const patientId = req.user.id;
    const appointments = await AppointmentService.getPatientAppointments(patientId);
    res.status(200).json(new ApiResponse(200, { appointments }));
  });

  static getDoctorAppointments = asyncHandler(async (req, res) => {
    const doctorId = req.user.id;
    const { filter } = req.query;
    const appointments = await AppointmentService.getDoctorAppointments(doctorId, filter);
    res.status(200).json(new ApiResponse(200, { appointments }));
  });

  static getAvailableSlots = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query;
    const slots = await AppointmentService.getAvailableSlots(doctorId, date);
    res.status(200).json(new ApiResponse(200, { slots }));
  });

  static createAppointment = asyncHandler(async (req, res) => {
    let patientId;
    if (req.user.role === 'Receptionist') {
      patientId = req.body.patient_id;
    } else {
      patientId = req.user.id;
    }
    const io = req.app.get('io');
    const appointment = await AppointmentService.createAppointment(patientId, req.body, io);
    res.status(201).json(new ApiResponse(201, { appointment }, 'Appointment booked successfully'));
  });

  static getConfiguredDates = asyncHandler(async (req, res) => {
    const { doctorId } = req.params;
    const dates = await AppointmentService.getConfiguredDates(doctorId);
    res.status(200).json(new ApiResponse(200, { dates }));
  });

  static rescheduleAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const patientId = req.user.id;
    const io = req.app.get('io');
    const appointment = await AppointmentService.rescheduleAppointment(id, patientId, req.body, io);
    res.status(200).json(new ApiResponse(200, { appointment }, 'Appointment rescheduled successfully'));
  });

  static cancelAppointment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const patientId = req.user.id;
    const appointment = await AppointmentService.cancelAppointment(id, patientId);
    res.status(200).json(new ApiResponse(200, { appointment }, 'Appointment cancelled successfully'));
  });
}

module.exports = AppointmentController;
