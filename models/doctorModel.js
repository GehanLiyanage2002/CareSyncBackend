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
      bio: decrypt(row.bio)
    };
  }

  static async upsertProfile(doctorId, profileData) {
    const { specialization, experience, bio } = profileData;
    const query = `
      INSERT INTO doctor_profiles (doctor_id, specialization, experience, bio, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (doctor_id) 
      DO UPDATE SET 
        specialization = EXCLUDED.specialization,
        experience = EXCLUDED.experience,
        bio = EXCLUDED.bio,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await db.query(query, [doctorId, encrypt(specialization), encrypt(experience), encrypt(bio)]);
    const row = result.rows[0];
    if (!row) return row;
    return {
      ...row,
      specialization: decrypt(row.specialization),
      experience: decrypt(row.experience),
      bio: decrypt(row.bio)
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

  static async getAppointmentsByDoctorId(doctorId) {
    const query = `
      SELECT 
        a.id, 
        a.appointment_date, 
        a.start_time, 
        a.status,
        u.full_name as patient_name,
        u.mobile_number as patient_contact
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = $1 
      ORDER BY a.appointment_date ASC, a.start_time ASC
    `;
    const result = await db.query(query, [doctorId]);
    // The users table has mobile_number encrypted, we should decrypt it if it's fetched
    return result.rows.map(row => ({
      ...row,
      patient_contact: row.patient_contact ? decrypt(row.patient_contact) : null
    }));
  }

  static async updateAppointmentStatus(appointmentId, doctorId, status) {
    const query = `
      UPDATE appointments 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND doctor_id = $3
      RETURNING *;
    `;
    const result = await db.query(query, [status, appointmentId, doctorId]);
    const row = result.rows[0];
    if (!row) return row;
    return {
      ...row,
      patient_name: decrypt(row.patient_name),
      patient_age: decrypt(row.patient_age),
      patient_gender: decrypt(row.patient_gender),
      patient_contact: decrypt(row.patient_contact),
      appointment_time: decrypt(row.appointment_time),
      reason: decrypt(row.reason)
    };
  }
  static async upsertSchedule(doctorId, scheduleData) {
    const { day_of_week, start_time, end_time, slot_duration_minutes } = scheduleData;
    const query = `
      INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (doctor_id, day_of_week) 
      DO UPDATE SET 
        start_time = EXCLUDED.start_time,
        end_time = EXCLUDED.end_time,
        slot_duration_minutes = EXCLUDED.slot_duration_minutes
      RETURNING *;
    `;
    const result = await db.query(query, [doctorId, day_of_week, start_time, end_time, slot_duration_minutes]);
    return result.rows[0];
  }

  static async getScheduleByDoctorId(doctorId) {
    const query = `
      SELECT * FROM doctor_schedules 
      WHERE doctor_id = $1 
      ORDER BY day_of_week ASC
    `;
    const result = await db.query(query, [doctorId]);
    return result.rows;
  }
}

module.exports = DoctorModel;
