const DoctorModel = require('../models/doctorModel');

class AppointmentController {
  /**
   * @route   PUT /api/appointments/doctor/availability
   * @desc    Toggle doctor availability
   * @access  Private (Doctor only)
   */
  static async toggleAvailability(req, res, next) {
    try {
      const doctorId = req.user.id;
      // Toggle logic using the model
      const isAvailable = await DoctorModel.toggleAvailability(doctorId);

      res.status(200).json({
        success: true,
        message: 'Availability updated successfully',
        is_available: isAvailable
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/appointments/doctor/my-appointments
   * @desc    Get all appointments for the logged-in doctor
   * @access  Private (Doctor only)
   */
  static async getDoctorAppointments(req, res, next) {
    try {
      const doctorId = req.user.id;
      
      const appointments = await DoctorModel.getAppointmentsByDoctorId(doctorId);

      res.status(200).json({
        success: true,
        appointments
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AppointmentController;
