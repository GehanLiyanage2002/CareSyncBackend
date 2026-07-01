const DoctorModel = require('../models/doctorModel');
const db = require('../config/db');
const { decrypt } = require('../utils/cryptoUtils');
const ApiError = require('../utils/ApiError');
const NotificationService = require('../services/notificationService');
const UserService = require('../services/userService');

class AppointmentService {
  static async toggleAvailability(doctorId, io) {
    const isAvailable = await DoctorModel.toggleAvailability(doctorId);

    if (io) {
      io.emit('doctorAvailabilityChanged', { doctor_id: doctorId, is_available: isAvailable });
    }

    return { is_available: isAvailable };
  }

  static async getPatientAppointments(patientId) {
    const result = await db.query(
      `SELECT 
        a.id,
        a.token_number,
        a.appointment_date,
        a.start_time,
        a.status,
        a.is_telemedicine,
        a.payment_method,
        a.created_at,
        u.full_name AS doctor_name,
        dp.specialization AS doctor_specialization,
        a.doctor_id,
        a.consultation_fee,
        CASE WHEN r.id IS NOT NULL THEN true ELSE false END AS has_review
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      LEFT JOIN doctor_profiles dp ON dp.doctor_id = a.doctor_id
      LEFT JOIN reviews r ON r.appointment_id = a.id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC, a.start_time DESC`,
      [patientId]
    );

    return result.rows.map(row => ({
      ...row,
      status: row.status.toLowerCase(),
      doctor_specialization: decrypt(row.doctor_specialization)
    }));
  }

  static async getDoctorAppointments(doctorId, filter) {
    let appointments = await DoctorModel.getAppointmentsByDoctorId(doctorId);

    if (filter === 'today') {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayLocalStr = `${yyyy}-${mm}-${dd}`;

      appointments = appointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        const aptYyyy = aptDate.getFullYear();
        const aptMm = String(aptDate.getMonth() + 1).padStart(2, '0');
        const aptDd = String(aptDate.getDate()).padStart(2, '0');
        const aptLocalStr = `${aptYyyy}-${aptMm}-${aptDd}`;
        
        return aptLocalStr === todayLocalStr;
      });
    }

    return appointments;
  }

  static async getAvailableSlots(doctorId, date) {
    if (!date) {
      throw new ApiError(400, 'Date query parameter is required (YYYY-MM-DD)');
    }

    const profileResult = await db.query('SELECT is_available FROM doctor_profiles WHERE doctor_id = $1', [doctorId]);
    if (profileResult.rows.length === 0 || !profileResult.rows[0].is_available) {
      return [];
    }

    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      throw new ApiError(400, 'Invalid date format');
    }

    const scheduleResult = await db.query(
      'SELECT start_time, end_time, slot_duration_minutes FROM doctor_schedules WHERE doctor_id = $1 AND schedule_date = $2',
      [doctorId, date]
    );

    if (scheduleResult.rows.length === 0) {
      return [];
    }

    const { start_time, end_time, slot_duration_minutes } = scheduleResult.rows[0];

    const parseTimeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const formatMinutesToTime = (totalMinutes) => {
      const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
      const mins = (totalMinutes % 60).toString().padStart(2, '0');
      return `${hours}:${mins}`;
    };

    const startMinutes = parseTimeToMinutes(start_time);
    const endMinutes = parseTimeToMinutes(end_time);

    const allSlots = [];
    let index = 0;
    for (let time = startMinutes; time + slot_duration_minutes <= endMinutes; time += slot_duration_minutes) {
      allSlots.push({
        time: formatMinutesToTime(time),
        isBuffer: (index + 1) % 4 === 0
      });
      index++;
    }

    const appointmentsResult = await db.query(
      "SELECT start_time FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'Cancelled'",
      [doctorId, date]
    );

    const bookedSlots = appointmentsResult.rows.map(row => {
      return row.start_time.substring(0, 5);
    });

    return allSlots.filter(slotObj => !bookedSlots.includes(slotObj.time));
  }

  static async createAppointment(patientId, appointmentData, io) {
    const { 
      doctor_id, 
      appointment_date, 
      start_time, 
      patient_name, 
      age, 
      mobile_number, 
      gender, 
      email, 
      payment_method,
      is_telemedicine 
    } = appointmentData;

    if (!doctor_id || !appointment_date || !start_time || !patient_name || !mobile_number) {
      throw new ApiError(400, 'Missing required fields');
    }

    const existing = await db.query(
      "SELECT id FROM appointments WHERE doctor_id = $1 AND appointment_date = $2 AND start_time = $3 AND status != 'Cancelled'",
      [doctor_id, appointment_date, start_time]
    );

    if (existing.rows.length > 0) {
      throw new ApiError(400, 'This slot is already booked. Please choose another.');
    }

    const docProfile = await db.query('SELECT specialization, consultation_fee FROM doctor_profiles WHERE doctor_id = $1', [doctor_id]);
    const profileRow = docProfile.rows[0];
    const spec = profileRow?.specialization ? decrypt(profileRow.specialization).toLowerCase() : '';
    const currentFee = profileRow?.consultation_fee || null;
    
    const isPsychology = spec.includes('psychology') || spec.includes('psychiatry');
    
    if (isPsychology) {
      if (!is_telemedicine) {
        throw new ApiError(400, 'Psychology doctors can only be booked for Telemedicine video consultations.');
      }
    } else {
      if (is_telemedicine) {
        throw new ApiError(400, 'Telemedicine is only available for Psychology doctors.');
      }
    }

    const tokenNumber = 'CS-' + Math.floor(1000 + Math.random() * 9000);

    const result = await db.query(
      `INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, start_time, status, 
        patient_name, age, mobile_number, gender, email, payment_method, token_number, is_telemedicine, consultation_fee
      ) VALUES ($1, $2, $3, $4, 'Pending', $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        patientId, doctor_id, appointment_date, start_time, 
        patient_name, age, mobile_number, gender, email, payment_method, tokenNumber, is_telemedicine || false, currentFee
      ]
    );

    if (io) {
      io.emit('slotBooked', { doctor_id, date: appointment_date, start_time });
      
      const patientsResult = await db.query(
        "SELECT COUNT(DISTINCT patient_id)::int as count FROM appointments WHERE doctor_id = $1 AND status::text != 'Cancelled'",
        [doctor_id]
      );
      const newPatientCount = patientsResult.rows[0].count;

      UserService.clearDoctorsCache();
      io.emit('doctorPatientsUpdated', { doctor_id, patients: newPatientCount });

      await NotificationService.sendNotification(
        io,
        doctor_id,
        'New Appointment Booked',
        `Patient ${patient_name} booked an appointment on ${appointment_date} at ${start_time}.`,
        'success'
      );
    } else {
      try {
        await NotificationService.sendNotification(
          null,
          doctor_id,
          'New Appointment Booked',
          `Patient ${patient_name} booked an appointment on ${appointment_date} at ${start_time}.`,
          'success'
        );
      } catch (e) {
        console.log('Notification skip if io missing');
      }
    }

    return result.rows[0];
  }

  static async getConfiguredDates(doctorId) {
    const query = `
      SELECT DISTINCT schedule_date 
      FROM doctor_schedules 
      WHERE doctor_id = $1 AND schedule_date >= CURRENT_DATE 
      ORDER BY schedule_date ASC
    `;
    const result = await db.query(query, [doctorId]);
    
    return result.rows.map(row => row.schedule_date);
  }

  static async rescheduleAppointment(id, patientId, { new_date, new_time }, io) {
    const appointmentResult = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
    const appointment = appointmentResult.rows[0];

    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }

    if (appointment.patient_id !== patientId) {
      throw new ApiError(403, 'Unauthorized to reschedule this appointment');
    }

    if (appointment.status.toLowerCase() !== 'pending') {
      throw new ApiError(400, 'Only Pending appointments can be rescheduled.');
    }

    const createdAt = new Date(appointment.created_at);
    const minutesSinceBooking = (Date.now() - createdAt.getTime()) / (1000 * 60);
    if (minutesSinceBooking > 60) {
      throw new ApiError(403, 'Rescheduling is only allowed within 1 hour of booking.');
    }

    const dateStr = appointment.appointment_date instanceof Date 
      ? `${appointment.appointment_date.getFullYear()}-${String(appointment.appointment_date.getMonth() + 1).padStart(2, '0')}-${String(appointment.appointment_date.getDate()).padStart(2, '0')}`
      : appointment.appointment_date.split('T')[0];
    
    let timeStr = '00:00';
    if (appointment.start_time instanceof Date) {
      timeStr = `${String(appointment.start_time.getHours()).padStart(2, '0')}:${String(appointment.start_time.getMinutes()).padStart(2, '0')}`;
    } else {
      timeStr = appointment.start_time.substring(0, 5);
    }

    const apptDateTime = new Date(`${dateStr}T${timeStr}:00`);

    if (apptDateTime.getTime() < Date.now()) {
      throw new ApiError(400, 'Cannot modify a past appointment.');
    }

    const hoursDiff = (apptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      throw new ApiError(403, 'Modifications are not allowed within 1 hour of the scheduled appointment time.');
    }

    const newApptDateTime = new Date(`${new_date}T${new_time}:00`);
    
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (newApptDateTime.getTime() < tomorrow.getTime()) {
      throw new ApiError(400, 'Appointments can only be rescheduled to tomorrow or a later date.');
    }

    const updatedResult = await db.query(
      "UPDATE appointments SET appointment_date = $1, start_time = $2, is_rescheduled = true, status = 'Pending' WHERE id = $3 RETURNING *",
      [new_date, new_time, id]
    );
    const updated = updatedResult.rows[0];

    if (io) {
      io.emit('appointmentRescheduled', { 
        doctor_id: updated.doctor_id, 
        appointment_id: updated.id,
        new_date: updated.appointment_date, 
        new_time: updated.start_time 
      });

      await NotificationService.sendNotification(
        io,
        updated.doctor_id,
        'Appointment Rescheduled',
        `Patient ${appointment.patient_name} rescheduled their appointment to ${new_date} at ${new_time}.`,
        'warning'
      );
    }

    return updated;
  }

  static async cancelAppointment(id, patientId) {
    const appointmentResult = await db.query('SELECT * FROM appointments WHERE id = $1', [id]);
    const appointment = appointmentResult.rows[0];

    if (!appointment) {
      throw new ApiError(404, 'Appointment not found');
    }

    if (appointment.patient_id !== patientId) {
      throw new ApiError(403, 'Unauthorized to cancel this appointment');
    }

    if (appointment.status.toLowerCase() !== 'pending' && appointment.status.toLowerCase() !== 'in progress') {
      throw new ApiError(400, 'Only Pending or In Progress appointments can be cancelled.');
    }

    const dateStr = appointment.appointment_date instanceof Date 
      ? `${appointment.appointment_date.getFullYear()}-${String(appointment.appointment_date.getMonth() + 1).padStart(2, '0')}-${String(appointment.appointment_date.getDate()).padStart(2, '0')}`
      : appointment.appointment_date.split('T')[0];
    
    let timeStr = '00:00';
    if (appointment.start_time instanceof Date) {
      timeStr = `${String(appointment.start_time.getHours()).padStart(2, '0')}:${String(appointment.start_time.getMinutes()).padStart(2, '0')}`;
    } else {
      timeStr = appointment.start_time.substring(0, 5);
    }

    const apptDateTime = new Date(`${dateStr}T${timeStr}:00`);

    if (apptDateTime.getTime() < Date.now()) {
      throw new ApiError(400, 'Cannot modify a past appointment.');
    }

    const hoursDiff = (apptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursDiff < 1) {
      throw new ApiError(403, 'Modifications are not allowed within 1 hour of the scheduled appointment time.');
    }

    const updatedResult = await db.query(
      'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
      ['Cancelled', id]
    );
    
    return updatedResult.rows[0];
  }
}

module.exports = AppointmentService;
