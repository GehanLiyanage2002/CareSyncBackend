const db = require('../config/db');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const DoctorModel = require('../models/doctorModel');
const { decrypt } = require('../utils/cryptoUtils');
const ApiError = require('../utils/ApiError');

class AdminService {
  static async getStats(startDate, endDate) {
    let dateFilterUsers = "";
    let dateFilterAppts = "";
    let params = [];

    if (startDate && endDate) {
      dateFilterUsers = "AND created_at >= $1 AND created_at <= $2";
      dateFilterAppts = "AND appointment_date >= $1 AND appointment_date <= $2";
      params = [startDate, endDate];
    }

    const patientCount = await db.query(`SELECT COUNT(*) FROM users WHERE role = 'Patient' ${dateFilterUsers}`, params);
    const doctorCount = await db.query(`SELECT COUNT(*) FROM users WHERE role = 'Doctor' ${dateFilterUsers}`, params);
    
    const apptCountQuery = startDate 
      ? `SELECT COUNT(*) FROM appointments WHERE appointment_date >= $1 AND appointment_date <= $2` 
      : `SELECT COUNT(*) FROM appointments`;
    const apptCount = await db.query(apptCountQuery, params);
    
    const completedCount = await db.query(`SELECT COUNT(*) FROM appointments WHERE status = 'Completed' ${dateFilterAppts}`, params);
    const canceledCount = await db.query(`SELECT COUNT(*) FROM appointments WHERE status = 'Cancelled' ${dateFilterAppts}`, params);
    
    const revenueQuery = `
      SELECT COALESCE(SUM(dp.consultation_fee), 0) as total_earnings
      FROM appointments a
      JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
      WHERE a.status = 'Completed' ${dateFilterAppts}
    `;
    const revenueResult = await db.query(revenueQuery, params);

    return {
      totalPatients: parseInt(patientCount.rows[0].count),
      totalDoctors: parseInt(doctorCount.rows[0].count),
      totalAppointments: parseInt(apptCount.rows[0].count),
      totalCompleted: parseInt(completedCount.rows[0].count),
      totalCancelled: parseInt(canceledCount.rows[0].count),
      totalRevenue: parseFloat(revenueResult.rows[0].total_earnings)
    };
  }

  static async getDoctors() {
    const query = `
      SELECT u.id, u.full_name, u.email, u.mobile_number, u.created_at, 
             dp.specialization, dp.experience, dp.is_approved, dp.consultation_fee, dp.is_available,
             CASE WHEN dp.id_card_front IS NOT NULL THEN true ELSE false END as has_id_card_front,
             CASE WHEN dp.id_card_rear IS NOT NULL THEN true ELSE false END as has_id_card_rear,
             (SELECT COUNT(DISTINCT patient_id) FROM appointments WHERE doctor_id = u.id) as total_patients,
             (SELECT COALESCE(ROUND(AVG(rating), 1), 0) FROM reviews WHERE doctor_id = u.id) as average_rating
      FROM users u
      LEFT JOIN doctor_profiles dp ON u.id = dp.doctor_id
      WHERE u.role = 'Doctor'
      ORDER BY u.created_at DESC
    `;
    const result = await db.query(query);

    return result.rows.map(row => ({
      ...row,
      mobile_number: row.mobile_number ? decrypt(row.mobile_number) : null,
      specialization: row.specialization ? decrypt(row.specialization) : 'Not Specified',
      experience: row.experience ? decrypt(row.experience) : 'Not Specified',
      has_id_card_front: row.has_id_card_front,
      has_id_card_rear: row.has_id_card_rear,
      total_patients: parseInt(row.total_patients) || 0,
      average_rating: parseFloat(row.average_rating) || 0
    }));
  }

  static async getDoctorIdCard(id, side) {
    if (side !== 'front' && side !== 'rear') {
      throw new ApiError(400, "Invalid side. Must be 'front' or 'rear'.");
    }

    const column = side === 'front' ? 'id_card_front' : 'id_card_rear';
    const mimeColumn = side === 'front' ? 'id_card_front_mimetype' : 'id_card_rear_mimetype';

    const result = await db.query(`SELECT ${column}, ${mimeColumn} FROM doctor_profiles WHERE doctor_id = $1`, [id]);
    
    if (result.rows.length === 0 || !result.rows[0][column]) {
      throw new ApiError(404, "ID card image not found.");
    }

    return {
      buffer: result.rows[0][column],
      mimetype: result.rows[0][mimeColumn] || 'application/octet-stream'
    };
  }

  static async toggleDoctorApproval(id, is_approved) {
    const query = `
      UPDATE doctor_profiles 
      SET is_approved = $1
      WHERE doctor_id = $2
      RETURNING is_approved
    `;
    const result = await db.query(query, [is_approved, id]);

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Doctor profile not found');
    }

    return { is_approved: result.rows[0].is_approved };
  }

  static async getPatients() {
    const query = `
      SELECT id, full_name, email, mobile_number, blood_group, created_at
      FROM users 
      WHERE role = 'Patient'
      ORDER BY created_at DESC
    `;
    const result = await db.query(query);

    return result.rows.map(row => ({
      ...row,
      mobile_number: row.mobile_number ? decrypt(row.mobile_number) : null,
      blood_group: row.blood_group ? decrypt(row.blood_group) : null,
    }));
  }

  static async getPatientAppointments(id) {
    const query = `
      SELECT 
        a.id, a.appointment_date as date, a.start_time as time, a.status, a.reason,
        d.full_name as doctor_name,
        dp.specialization as doctor_specialization
      FROM appointments a
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC, a.start_time DESC
    `;
    const result = await db.query(query, [id]);
    
    return result.rows.map(row => ({
      ...row,
      reason: row.reason ? decrypt(row.reason) : null,
      doctor_specialization: row.doctor_specialization ? decrypt(row.doctor_specialization) : 'Not Specified',
    }));
  }

  static async getAppointments() {
    const query = `
      SELECT 
        a.id, a.appointment_date as date, a.start_time as time, a.status, a.reason,
        a.age, a.gender, a.mobile_number,
        p.full_name as patient_name,
        d.full_name as doctor_name,
        dp.specialization as doctor_specialization,
        dp.consultation_fee as fees
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
      ORDER BY a.appointment_date DESC, a.start_time DESC
    `;
    const result = await db.query(query);
    
    return result.rows.map(row => ({
      ...row,
      reason: row.reason ? decrypt(row.reason) : null,
      doctor_specialization: row.doctor_specialization ? decrypt(row.doctor_specialization) : 'Not Specified',
    }));
  }

  static async cancelAppointment(id) {
    const checkQuery = 'SELECT id, status FROM appointments WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      throw new ApiError(404, 'Appointment not found.');
    }
    
    if (checkResult.rows[0].status === 'Cancelled') {
      throw new ApiError(400, 'Appointment is already cancelled.');
    }

    const updateQuery = `
      UPDATE appointments 
      SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *
    `;
    const updateResult = await db.query(updateQuery, [id]);

    return updateResult.rows[0];
  }

  static async getEarnings(startDate, endDate) {
    let params = [];
    let joinCondition = '';
    if (startDate && endDate) {
      joinCondition = 'AND a.appointment_date >= $1 AND a.appointment_date <= $2';
      params = [startDate, endDate];
    }

    const query = `
      SELECT 
        d.id as doctor_id,
        d.full_name as doctor_name,
        dp.specialization,
        COUNT(a.id) as total_appointments,
        SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) as completed_appointments,
        SUM(CASE WHEN a.status = 'Cancelled' THEN 1 ELSE 0 END) as canceled_appointments,
        COALESCE(dp.consultation_fee, 0) as consultation_fee,
        (SUM(CASE WHEN a.status = 'Completed' THEN 1 ELSE 0 END) * COALESCE(dp.consultation_fee, 0)) as total_earnings
      FROM users d
      LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
      LEFT JOIN appointments a ON a.doctor_id = d.id ${joinCondition}
      WHERE d.role = 'Doctor'
      GROUP BY d.id, d.full_name, dp.specialization, dp.consultation_fee
      ORDER BY total_earnings DESC
    `;
    const result = await db.query(query, params);

    return result.rows.map(row => ({
      ...row,
      specialization: row.specialization ? decrypt(row.specialization) : 'Not Specified',
    }));
  }

  static async createDoctor({ full_name, email, password, mobile_number, specialization, experience, bio, consultation_fee }) {
    if (!full_name || !email || !password) {
      throw new ApiError(400, 'full_name, email, and password are required.');
    }

    const exists = await User.findByEmail(email);
    if (exists) {
      throw new ApiError(400, 'A user with this email already exists.');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.createUser({
      full_name,
      email,
      password_hash,
      role: 'Doctor',
      mobile_number: mobile_number || null,
      is_verified: true
    });

    await DoctorModel.upsertProfile(newUser.id, {
      specialization: specialization || '',
      experience: experience || '',
      bio: bio || '',
      location: '',
      qualifications: ''
    });

    await db.query(
      `UPDATE doctor_profiles SET is_approved = true WHERE doctor_id = $1`,
      [newUser.id]
    );

    if (consultation_fee && !isNaN(consultation_fee)) {
      await DoctorModel.updateConsultationFee(newUser.id, Number(consultation_fee));
    }

    return { id: newUser.id, full_name: newUser.full_name, email: newUser.email };
  }

  static async updateDoctorSchedule(id, { schedule_date, start_time, end_time, slot_duration_minutes }) {
    if (!schedule_date || !start_time || !end_time) {
      throw new ApiError(400, 'schedule_date, start_time, and end_time are required.');
    }
    const result = await DoctorModel.upsertSchedule(id, { schedule_date, start_time, end_time, slot_duration_minutes: parseInt(slot_duration_minutes) || 15 });
    return result;
  }

  static async updateDoctorFee(id, fee) {
    if (!fee || isNaN(fee)) {
      throw new ApiError(400, 'A valid fee is required.');
    }
    await DoctorModel.updateConsultationFee(id, Number(fee));
  }

  static async updateDoctorProfileImage(id, fileData, fileMimeType) {
    if (!fileData || !fileMimeType) {
      throw new ApiError(400, 'No image file provided.');
    }

    await db.query(
      'UPDATE users SET profile_image = $1, profile_image_mimetype = $2 WHERE id = $3 AND role = $4',
      [fileData, fileMimeType, id, 'Doctor']
    );

    return {
      imageUrl: `http://localhost:5000/api/users/profile-image/${id}?t=${Date.now()}`
    };
  }

  static async deleteDoctor(id) {
    const checkQuery = `SELECT role FROM users WHERE id = $1`;
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0 || checkResult.rows[0].role !== 'Doctor') {
      throw new ApiError(404, 'Doctor not found');
    }

    const deleteQuery = `DELETE FROM users WHERE id = $1 RETURNING id`;
    await db.query(deleteQuery, [id]);
  }
}

module.exports = AdminService;
