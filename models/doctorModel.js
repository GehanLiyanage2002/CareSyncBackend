const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/cryptoUtils');

class DoctorModel {
  static async getProfileByDoctorId(doctorId) {
    const result = await db.query('SELECT * FROM doctor_profiles WHERE doctor_id = $1', [doctorId]);
    const row = result.rows[0];
    if (!row) return row;
    return {
      ...row,
      specialization: decrypt(row.specialization),
      experience: decrypt(row.experience),
      bio: decrypt(row.bio),
      qualifications: row.qualifications ? decrypt(row.qualifications) : '',
      location: row.location || ''
    };
  }

  static async upsertProfile(doctorId, profileData) {
    const { specialization, experience, bio, location, qualifications } = profileData;
    const query = `
      INSERT INTO doctor_profiles (doctor_id, specialization, experience, bio, location, qualifications, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (doctor_id) 
      DO UPDATE SET 
        specialization = EXCLUDED.specialization,
        experience = EXCLUDED.experience,
        bio = EXCLUDED.bio,
        location = EXCLUDED.location,
        qualifications = EXCLUDED.qualifications,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await db.query(query, [doctorId, encrypt(specialization), encrypt(experience), encrypt(bio), location || '', encrypt(qualifications || '')]);
    const row = result.rows[0];
    if (!row) return row;
    return {
      ...row,
      specialization: decrypt(row.specialization),
      experience: decrypt(row.experience),
      bio: decrypt(row.bio),
      qualifications: row.qualifications ? decrypt(row.qualifications) : '',
      location: row.location || ''
    };
  }

  static async toggleAvailability(doctorId) {
    const query = `
      UPDATE doctor_profiles 
      SET is_available = NOT is_available 
      WHERE doctor_id = $1 
      RETURNING is_available;
    `;
    const result = await db.query(query, [doctorId]);
    if (result.rows.length === 0) {
      // If doctor profile doesn't exist, we should probably return false or throw
      // For now, let's create a blank profile if they toggle
      const insertQuery = `
        INSERT INTO doctor_profiles (doctor_id, is_available) 
        VALUES ($1, false) 
        RETURNING is_available;
      `;
      const insertResult = await db.query(insertQuery, [doctorId]);
      return insertResult.rows[0].is_available;
    }
    return result.rows[0].is_available;
  }

  static async updateConsultationFee(doctorId, fee) {
    const query = `
      UPDATE doctor_profiles
      SET consultation_fee = $2, updated_at = CURRENT_TIMESTAMP
      WHERE doctor_id = $1
      RETURNING *;
    `;
    const result = await db.query(query, [doctorId, fee]);
    return result.rows[0];
  }

  static async getAppointmentsByDoctorId(doctorId) {
    const query = `
      SELECT 
        id, 
        patient_id,
        token_number,
        appointment_date, 
        start_time, 
        status,
        is_telemedicine,
        patient_name,
        age as patient_age,
        gender as patient_gender,
        mobile_number as patient_contact,
        payment_method
      FROM appointments 
      WHERE doctor_id = $1 
      ORDER BY appointment_date ASC, start_time ASC
    `;
    const result = await db.query(query, [doctorId]);
    return result.rows.map(row => ({ ...row, status: row.status.toLowerCase() }));
  }

  static async updateAppointmentStatus(appointmentId, doctorId, status) {
    const query = `
      UPDATE appointments 
      SET status = $1
      WHERE id = $2 AND doctor_id = $3
      RETURNING *;
    `;
    const result = await db.query(query, [status, appointmentId, doctorId]);
    return result.rows[0];
  }
  static async upsertSchedule(doctorId, scheduleData) {
    const { schedule_date, start_time, end_time, slot_duration_minutes } = scheduleData;
    const query = `
      INSERT INTO doctor_schedules (doctor_id, schedule_date, start_time, end_time, slot_duration_minutes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (doctor_id, schedule_date) 
      DO UPDATE SET 
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        slot_duration_minutes = EXCLUDED.slot_duration_minutes
      RETURNING *;
    `;
    const result = await db.query(query, [doctorId, schedule_date, start_time, end_time, slot_duration_minutes]);
    return result.rows[0];
  }

  static async getScheduleByDoctorId(doctorId) {
    const query = `
      SELECT * FROM doctor_schedules 
      WHERE doctor_id = $1 
      ORDER BY schedule_date ASC
    `;
    const result = await db.query(query, [doctorId]);
    return result.rows;
  }
}

module.exports = DoctorModel;
