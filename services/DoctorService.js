const DoctorModel = require('../models/doctorModel');
const PatientModel = require('../models/patientModel');
const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const NotificationService = require('./notificationService');

class DoctorService {
  static async getProfile(doctorId) {
    const profile = await DoctorModel.getProfileByDoctorId(doctorId);
    const userResult = await db.query('SELECT full_name, email, mobile_number FROM users WHERE id = $1', [doctorId]);
    const userInfo = userResult.rows[0];
    return { 
      profile: profile || {}, 
      user: userInfo || {} 
    };
  }

  static async getPatientProfile(patientId) {
    const profile = await PatientModel.getProfileByPatientId(patientId);
    return { profile: profile || {} };
  }

  static async updateProfile(doctorId, bodyData, io) {
    const { specialization, experience, bio, full_name, email, mobile_number, location, qualifications } = bodyData;
    
    const updatedProfile = await DoctorModel.upsertProfile(doctorId, {
      specialization, experience, bio, location, qualifications
    });

    if (full_name || mobile_number) {
      await db.query(
        'UPDATE users SET full_name = COALESCE($1, full_name), mobile_number = COALESCE($2, mobile_number) WHERE id = $3',
        [full_name, mobile_number, doctorId]
      );
    }

    if (io) {
      io.emit('doctorProfileUpdated', {
        doctor_id: doctorId,
        location: updatedProfile.location,
        specialization: updatedProfile.specialization,
        experience: updatedProfile.experience,
        bio: updatedProfile.bio,
        qualifications: updatedProfile.qualifications
      });
    }

    return { profile: updatedProfile };
  }

  static async updateFee(doctorId, fee, io) {
    if (fee === undefined || isNaN(fee) || fee < 0) {
      throw new ApiError(400, 'Valid consultation fee is required');
    }

    const updatedProfile = await DoctorModel.updateConsultationFee(doctorId, fee);
    
    if (io) {
      io.emit('doctorFeeChanged', { doctor_id: doctorId, consultation_fee: fee });
    }
    
    return { profile: updatedProfile };
  }

  static async getAppointments(doctorId, filter) {
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

    return { appointments };
  }

  static async updateAppointmentStatus(id, doctorId, reqStatus, io) {
    let status = reqStatus;

    if (status && status.toLowerCase() === 'in progress') {
      status = 'In Progress';
    } else if (status) {
      status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }

    if (!['Pending', 'In Progress', 'Completed', 'Cancelled'].includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }

    const updated = await DoctorModel.updateAppointmentStatus(id, doctorId, status);
    if (!updated) {
      throw new ApiError(404, 'Appointment not found');
    }

    if (io) {
      io.emit('appointmentStatusChanged', {
        appointment_id: id,
        doctor_id: doctorId,
        status,
        patient_id: updated.patient_id
      });
    }

    await NotificationService.sendNotification(
      io,
      updated.patient_id,
      'Appointment Status Updated',
      `Your appointment status has been updated to ${status}.`,
      status === 'In Progress' ? 'success' : status === 'Cancelled' ? 'error' : 'info'
    );

    return { appointment: updated };
  }

  static async getSchedule(doctorId) {
    const schedule = await DoctorModel.getScheduleByDoctorId(doctorId);
    return { schedule };
  }

  static async updateSchedule(doctorId, bodyData) {
    const { schedule_date, start_time, end_time, slot_duration_minutes } = bodyData;

    if (!schedule_date) {
      throw new ApiError(400, 'Schedule date is required');
    }

    const updatedSchedule = await DoctorModel.upsertSchedule(doctorId, {
      schedule_date, start_time, end_time, slot_duration_minutes
    });

    return { schedule: updatedSchedule };
  }

  static async deleteSchedule(doctorId, scheduleId) {
    if (!scheduleId) {
      throw new ApiError(400, 'Schedule ID is required');
    }

    const deletedSchedule = await DoctorModel.deleteSchedule(doctorId, scheduleId);

    if (!deletedSchedule) {
      throw new ApiError(404, 'Schedule not found or unauthorized');
    }

    return {};
  }
}

module.exports = DoctorService;
