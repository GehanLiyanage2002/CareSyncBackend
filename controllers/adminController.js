const db = require('../config/db');
const { decrypt } = require('../utils/cryptoUtils');

class AdminController {
  
  /**
   * @route   GET /api/admin/stats
   * @desc    Get top-level dashboard statistics
   * @access  Private (Admin)
   */
  static async getStats(req, res, next) {
    try {
      const patientCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'Patient'");
      const doctorCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'Doctor'");
      const apptCount = await db.query("SELECT COUNT(*) FROM appointments");
      
      // Calculate total revenue (assuming platform fee or just total sum of consultation fees)
      // Since consultation_fee is in doctor_profiles, we join it with appointments where status is completed
      // For now, let's just sum up all completed appointments if consultation_fee exists
      const revenueQuery = `
        SELECT COALESCE(SUM(dp.consultation_fee), 0) as total_earnings
        FROM appointments a
        JOIN doctor_profiles dp ON a.doctor_id = dp.doctor_id
        WHERE a.status = 'Completed'
      `;
      const revenueResult = await db.query(revenueQuery);

      res.status(200).json({
        success: true,
        stats: {
          totalPatients: parseInt(patientCount.rows[0].count),
          totalDoctors: parseInt(doctorCount.rows[0].count),
          totalAppointments: parseInt(apptCount.rows[0].count),
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
               dp.specialization, dp.experience, dp.is_approved, dp.consultation_fee
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
          a.id, a.appointment_date as date, a.appointment_time as time, a.status, a.reason,
          p.full_name as patient_name,
          d.full_name as doctor_name
        FROM appointments a
        JOIN users p ON a.patient_id = p.id
        JOIN users d ON a.doctor_id = d.id
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
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
      const query = `
        SELECT 
          d.id as doctor_id,
          d.full_name as doctor_name,
          dp.specialization,
          COUNT(a.id) as completed_appointments,
          COALESCE(dp.consultation_fee, 0) as consultation_fee,
          (COUNT(a.id) * COALESCE(dp.consultation_fee, 0)) as total_earnings
        FROM users d
        LEFT JOIN doctor_profiles dp ON d.id = dp.doctor_id
        LEFT JOIN appointments a ON a.doctor_id = d.id AND a.status = 'Completed'
        WHERE d.role = 'Doctor'
        GROUP BY d.id, d.full_name, dp.specialization, dp.consultation_fee
        ORDER BY total_earnings DESC
      `;
      const result = await db.query(query);

      const earnings = result.rows.map(row => ({
        ...row,
        specialization: row.specialization ? decrypt(row.specialization) : 'Not Specified',
      }));

      res.status(200).json({ success: true, earnings });
    } catch (error) {
      next(error);
    }
  }

}

module.exports = AdminController;
