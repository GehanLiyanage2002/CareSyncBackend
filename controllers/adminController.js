const db = require('../config/db');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const DoctorModel = require('../models/doctorModel');
const { decrypt } = require('../utils/cryptoUtils');


class AdminController {
  
  /**
   * @route   GET /api/admin/stats
   * @desc    Get top-level dashboard statistics
   * @access  Private (Admin)
   */
  static async getStats(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
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

      res.status(200).json({
        success: true,
        stats: {
          totalPatients: parseInt(patientCount.rows[0].count),
          totalDoctors: parseInt(doctorCount.rows[0].count),
          totalAppointments: parseInt(apptCount.rows[0].count),
          totalCompleted: parseInt(completedCount.rows[0].count),
          totalCancelled: parseInt(canceledCount.rows[0].count),
          totalRevenue: parseFloat(revenueResult.rows[0].total_earnings)
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/admin/doctors
   * @desc    Get all doctors (both approved and pending)
   * @access  Private (Admin)
   */
  static async getDoctors(req, res, next) {
    try {
      const query = `
        SELECT u.id, u.full_name, u.email, u.mobile_number, u.created_at, 
               dp.specialization, dp.experience, dp.is_approved, dp.consultation_fee, dp.is_available
        FROM users u
        LEFT JOIN doctor_profiles dp ON u.id = dp.doctor_id
        WHERE u.role = 'Doctor'
        ORDER BY u.created_at DESC
      `;
      const result = await db.query(query);

      const doctors = result.rows.map(row => ({
        ...row,
        mobile_number: row.mobile_number ? decrypt(row.mobile_number) : null,
        specialization: row.specialization ? decrypt(row.specialization) : 'Not Specified',
        experience: row.experience ? decrypt(row.experience) : 'Not Specified',
      }));

      res.status(200).json({ success: true, doctors });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/admin/doctors/:id/approve
   * @desc    Toggle a doctor's approval status
   * @access  Private (Admin)
   */
  static async toggleDoctorApproval(req, res, next) {
    try {
      const { id } = req.params;
      const { is_approved } = req.body;
      
      const query = `
        UPDATE doctor_profiles 
        SET is_approved = $1
        WHERE doctor_id = $2
        RETURNING is_approved
      `;
      const result = await db.query(query, [is_approved, id]);

      if (result.rows.length === 0) {
        res.status(404);
        return next(new Error('Doctor profile not found'));
      }

      res.status(200).json({ 
        success: true, 
        message: `Doctor ${is_approved ? 'approved' : 'suspended'} successfully.`,
        is_approved: result.rows[0].is_approved
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/admin/patients
   * @desc    Get all patients
   * @access  Private (Admin)
   */
  static async getPatients(req, res, next) {
    try {
      const query = `
        SELECT id, full_name, email, mobile_number, blood_group, created_at
        FROM users 
        WHERE role = 'Patient'
        ORDER BY created_at DESC
      `;
      const result = await db.query(query);

      const patients = result.rows.map(row => ({
        ...row,
        mobile_number: row.mobile_number ? decrypt(row.mobile_number) : null,
        blood_group: row.blood_group ? decrypt(row.blood_group) : null,
      }));

      res.status(200).json({ success: true, patients });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/admin/appointments
   * @desc    Get all appointments history
   * @access  Private (Admin)
   */
  static async getAppointments(req, res, next) {
    try {
      const query = `
        SELECT 
          a.id, a.appointment_date as date, a.start_time as time, a.status, a.reason,
          p.full_name as patient_name,
          d.full_name as doctor_name
        FROM appointments a
        JOIN users p ON a.patient_id = p.id
        JOIN users d ON a.doctor_id = d.id
        ORDER BY a.appointment_date DESC, a.start_time DESC
      `;
      const result = await db.query(query);
      
      const appointments = result.rows.map(row => ({
        ...row,
        reason: row.reason ? decrypt(row.reason) : null
      }));

      res.status(200).json({ success: true, appointments });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/admin/earnings
   * @desc    Get earnings per doctor
   * @access  Private (Admin)
   */
  static async getEarnings(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
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

      const earnings = result.rows.map(row => ({
        ...row,
        specialization: row.specialization ? decrypt(row.specialization) : 'Not Specified',
      }));

      res.status(200).json({ success: true, earnings });
    } catch (error) {
      next(error);
    }
  }


  /**
   * @route   POST /api/admin/doctors
   * @desc    Admin creates a new doctor account (pre-approved, no OTP)
   * @access  Private (Admin)
   */
  static async createDoctor(req, res, next) {
    try {
      const { full_name, email, password, mobile_number, specialization, experience, bio, consultation_fee } = req.body;

      if (!full_name || !email || !password) {
        res.status(400);
        return next(new Error('full_name, email, and password are required.'));
      }

      const exists = await User.findByEmail(email);
      if (exists) {
        res.status(400);
        return next(new Error('A user with this email already exists.'));
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // Create verified user (admin-created doctors are pre-approved)
      const newUser = await User.createUser({
        full_name,
        email,
        password_hash,
        role: 'Doctor',
        mobile_number: mobile_number || null,
        is_verified: true
      });

      // Create doctor profile with is_approved = true
      await DoctorModel.upsertProfile(newUser.id, {
        specialization: specialization || '',
        experience: experience || '',
        bio: bio || '',
        location: '',
        qualifications: ''
      });

      // Auto-approve
      await db.query(
        `UPDATE doctor_profiles SET is_approved = true WHERE doctor_id = $1`,
        [newUser.id]
      );

      // Set consultation fee if provided
      if (consultation_fee && !isNaN(consultation_fee)) {
        await DoctorModel.updateConsultationFee(newUser.id, Number(consultation_fee));
      }

      res.status(201).json({
        success: true,
        message: 'Doctor account created successfully.',
        doctor: { id: newUser.id, full_name: newUser.full_name, email: newUser.email }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/admin/doctors/:id/schedule
   * @desc    Admin sets a doctor's schedule
   * @access  Private (Admin)
   */
  static async updateDoctorSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const { schedule_date, start_time, end_time, slot_duration_minutes } = req.body;
      if (!schedule_date || !start_time || !end_time) {
        res.status(400);
        return next(new Error('schedule_date, start_time, and end_time are required.'));
      }
      const result = await DoctorModel.upsertSchedule(id, { schedule_date, start_time, end_time, slot_duration_minutes: parseInt(slot_duration_minutes) || 15 });
      res.status(200).json({ success: true, message: 'Schedule updated.', schedule: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/admin/doctors/:id/fee
   * @desc    Admin sets a doctor's consultation fee
   * @access  Private (Admin)
   */
  static async updateDoctorFee(req, res, next) {
    try {
      const { id } = req.params;
      const { fee } = req.body;
      if (!fee || isNaN(fee)) {
        res.status(400);
        return next(new Error('A valid fee is required.'));
      }
      await DoctorModel.updateConsultationFee(id, Number(fee));
      res.status(200).json({ success: true, message: 'Consultation fee updated.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/admin/doctors/:id/profile-image
   * @desc    Admin uploads a profile image for a specific doctor
   * @access  Private (Admin)
   */
  static async updateDoctorProfileImage(req, res, next) {
    try {
      const { id } = req.params;
      const fileData = req.file ? req.file.buffer : null;
      const fileMimeType = req.file ? req.file.mimetype : null;

      if (!fileData || !fileMimeType) {
        res.status(400);
        return next(new Error('No image file provided.'));
      }

      await db.query(
        'UPDATE users SET profile_image = $1, profile_image_mimetype = $2 WHERE id = $3 AND role = $4',
        [fileData, fileMimeType, id, 'Doctor']
      );

      res.status(200).json({
        success: true,
        message: 'Doctor profile image updated.',
        imageUrl: `http://localhost:5000/api/users/profile-image/${id}?t=${Date.now()}`
      });
    } catch (error) {
      next(error);
    }
  }

}

module.exports = AdminController;
