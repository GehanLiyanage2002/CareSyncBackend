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

  static async getAppointmentsByDoctorId(doctorId) {
    const query = `
      SELECT * FROM appointments 
      WHERE doctor_id = $1 
      ORDER BY appointment_date ASC, appointment_time ASC
    `;
    const result = await db.query(query, [doctorId]);
    return result.rows.map(row => ({
      ...row,
      patient_name: decrypt(row.patient_name),
      patient_age: decrypt(row.patient_age),
      patient_gender: decrypt(row.patient_gender),
      patient_contact: decrypt(row.patient_contact),
      appointment_time: decrypt(row.appointment_time),
      reason: decrypt(row.reason)
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
}

module.exports = DoctorModel;
