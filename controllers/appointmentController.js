const DoctorModel = require('../models/doctorModel');
const db = require('../config/db');

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

  /**
   * @route   GET /api/appointments/slots/:doctorId?date=YYYY-MM-DD
   * @desc    Get available time slots for a doctor on a specific date
   * @access  Public (or protected depending on requirements, usually Patient)
   */
  static async getAvailableSlots(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ success: false, message: 'Date query parameter is required (YYYY-MM-DD)' });
      }

      // Check if doctor is available globally
      const profileResult = await db.query('SELECT is_available FROM doctor_profiles WHERE doctor_id = $1', [doctorId]);
      if (profileResult.rows.length === 0 || !profileResult.rows[0].is_available) {
        return res.status(200).json({ success: true, slots: [] });
      }

      // Find day of week (0-6, where 0 is Sunday)
      const requestedDate = new Date(date);
      if (isNaN(requestedDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      const dayOfWeek = requestedDate.getDay();

      // Fetch doctor's schedule for that day
      const scheduleResult = await db.query(
        'SELECT start_time, end_time, slot_duration_minutes FROM doctor_schedules WHERE doctor_id = $1 AND day_of_week = $2',
        [doctorId, dayOfWeek]
      );

      if (scheduleResult.rows.length === 0) {
        return res.status(200).json({ success: true, slots: [] });
      }

      const { start_time, end_time, slot_duration_minutes } = scheduleResult.rows[0];

      // Helper function to parse 'HH:mm:ss' to minutes from midnight
      const parseTimeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      // Helper function to format minutes to 'HH:mm'
      const formatMinutesToTime = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
        const mins = (totalMinutes % 60).toString().padStart(2, '0');
        return `${hours}:${mins}`;
      };

      const startMinutes = parseTimeToMinutes(start_time);
      const endMinutes = parseTimeToMinutes(end_time);

      // Generate all possible slots
      const allSlots = [];
      for (let time = startMinutes; time + slot_duration_minutes <= endMinutes; time += slot_duration_minutes) {
        allSlots.push(formatMinutesToTime(time));
      }

      // Fetch booked appointments for that date
      const appointmentsResult = await db.query(
        "SELECT start_time FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'cancelled'",
        [doctorId, date]
      );

      // postgres returns start_time as 'HH:mm:ss'
      const bookedSlots = appointmentsResult.rows.map(row => {
        // convert 'HH:mm:ss' to 'HH:mm'
        return row.start_time.substring(0, 5);
      });

      // Filter out booked slots
      const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));

      res.status(200).json({
        success: true,
        slots: availableSlots
      });
    } catch (error) {
      console.error('Error in getAvailableSlots:', error);
      next(error);
    }
  }
}

module.exports = AppointmentController;
