const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/cryptoUtils');

class DoctorModel {
  static async getProfileByDoctorId(doctorId) {
    const result = await db.query('SELECT * FROM doctor_profiles WHERE doctor_id = $1', [doctorId]);
    const row = result.rows[0];
    if (!row) return row;
    return {
      ...row,
      medical_id: row.medical_id ? decrypt(row.medical_id) : '',
      specialization: decrypt(row.specialization),
      experience: decrypt(row.experience),
      bio: decrypt(row.bio),
      qualifications: row.qualifications ? decrypt(row.qualifications) : '',
      location: row.location || ''
    };
  }

  static async upsertProfile(doctorId, profileData) {
    // Fetch existing profile to preserve data not passed in profileData
    const existingResult = await db.query('SELECT * FROM doctor_profiles WHERE doctor_id = $1', [doctorId]);
    const existing = existingResult.rows[0] || {};
    
    // Decrypt existing values to merge properly
    const currentMedicalId = existing.medical_id ? decrypt(existing.medical_id) : '';
    const currentSpecialization = existing.specialization ? decrypt(existing.specialization) : '';
    const currentExperience = existing.experience ? decrypt(existing.experience) : '';
    const currentBio = existing.bio ? decrypt(existing.bio) : '';
    const currentQualifications = existing.qualifications ? decrypt(existing.qualifications) : '';

    const mergedData = {
      medical_id: profileData.medical_id !== undefined ? profileData.medical_id : currentMedicalId,
      specialization: profileData.specialization !== undefined ? profileData.specialization : currentSpecialization,
      experience: profileData.experience !== undefined ? profileData.experience : currentExperience,
      bio: profileData.bio !== undefined ? profileData.bio : currentBio,
      location: profileData.location !== undefined ? profileData.location : (existing.location || ''),
      qualifications: profileData.qualifications !== undefined ? profileData.qualifications : currentQualifications,
      id_card_front: profileData.id_card_front !== undefined ? profileData.id_card_front : existing.id_card_front,
      id_card_front_mimetype: profileData.id_card_front_mimetype !== undefined ? profileData.id_card_front_mimetype : existing.id_card_front_mimetype,
      id_card_rear: profileData.id_card_rear !== undefined ? profileData.id_card_rear : existing.id_card_rear,
      id_card_rear_mimetype: profileData.id_card_rear_mimetype !== undefined ? profileData.id_card_rear_mimetype : existing.id_card_rear_mimetype
    };

    const { medical_id, specialization, experience, bio, location, qualifications, id_card_front, id_card_front_mimetype, id_card_rear, id_card_rear_mimetype } = mergedData;
    
    const query = `
      INSERT INTO doctor_profiles (doctor_id, medical_id, specialization, experience, bio, location, qualifications, id_card_front, id_card_front_mimetype, id_card_rear, id_card_rear_mimetype, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      ON CONFLICT (doctor_id) 
      DO UPDATE SET 
        medical_id = EXCLUDED.medical_id,
        specialization = EXCLUDED.specialization,
        experience = EXCLUDED.experience,
        bio = EXCLUDED.bio,
        location = EXCLUDED.location,
        qualifications = EXCLUDED.qualifications,
        id_card_front = EXCLUDED.id_card_front,
        id_card_front_mimetype = EXCLUDED.id_card_front_mimetype,
        id_card_rear = EXCLUDED.id_card_rear,
        id_card_rear_mimetype = EXCLUDED.id_card_rear_mimetype,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const result = await db.query(query, [
      doctorId, 
      encrypt(medical_id || ''),
      encrypt(specialization || ''), 
      encrypt(experience || ''), 
      encrypt(bio || ''), 
      location || '', 
      encrypt(qualifications || ''),
      id_card_front || null,
      id_card_front_mimetype || null,
      id_card_rear || null,
      id_card_rear_mimetype || null
    ]);
    const row = result.rows[0];
    if (!row) return row;
    return {
      ...row,
      medical_id: row.medical_id ? decrypt(row.medical_id) : '',
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
        a.id, 
        a.patient_id,
        a.token_number,
        a.appointment_date, 
        a.start_time, 
        a.status,
        a.is_telemedicine,
        COALESCE(u.full_name, a.patient_name) as patient_name,
        a.age as patient_age,
        a.gender as patient_gender,
        a.mobile_number as appointment_contact,
        u.mobile_number as user_contact,
        a.payment_method,
        a.is_rescheduled,
        a.consultation_fee
      FROM appointments a
      LEFT JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = $1 
      ORDER BY a.appointment_date ASC, a.start_time ASC
    `;
    const result = await db.query(query, [doctorId]);
    return result.rows.map(row => {
      let finalContact = row.appointment_contact;
      if (row.user_contact) {
        try {
          finalContact = decrypt(row.user_contact);
        } catch (e) {
          finalContact = row.user_contact;
        }
      }
      return { 
        ...row, 
        patient_contact: finalContact,
        status: row.status.toLowerCase() 
      };
    });
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

  static async deleteSchedule(doctorId, scheduleId) {
    const query = `
      DELETE FROM doctor_schedules 
      WHERE id = $1 AND doctor_id = $2
      RETURNING *;
    `;
    const result = await db.query(query, [scheduleId, doctorId]);
    return result.rows[0];
  }
}

module.exports = DoctorModel;
