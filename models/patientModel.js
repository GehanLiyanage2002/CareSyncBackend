const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/cryptoUtils');

class PatientModel {
  static async setupPatientProfilesTable() {
    const queryText = `
      CREATE TABLE IF NOT EXISTS patient_profiles (
        patient_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        date_of_birth TEXT,
        address TEXT,
        blood_group TEXT,
        allergies TEXT,
        chronic_conditions TEXT,
        emergency_contact_name TEXT,
        emergency_contact_number TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    try {
      await db.query(queryText);
      console.log('✅ patient_profiles table initialized successfully.');
    } catch (err) {
      console.warn('⚠️ Warning: Could not initialize patient_profiles table:', err.message);
    }
  }

  static async upsertProfile(patientId, profileData) {
    const {
      date_of_birth,
      address,
      blood_group,
      allergies,
      chronic_conditions,
      emergency_contact_name,
      emergency_contact_number
    } = profileData;

    const queryText = `
      INSERT INTO patient_profiles 
        (patient_id, date_of_birth, address, blood_group, allergies, chronic_conditions, emergency_contact_name, emergency_contact_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (patient_id) DO UPDATE SET
        date_of_birth = COALESCE(EXCLUDED.date_of_birth, patient_profiles.date_of_birth),
        address = COALESCE(EXCLUDED.address, patient_profiles.address),
        blood_group = COALESCE(EXCLUDED.blood_group, patient_profiles.blood_group),
        allergies = COALESCE(EXCLUDED.allergies, patient_profiles.allergies),
        chronic_conditions = COALESCE(EXCLUDED.chronic_conditions, patient_profiles.chronic_conditions),
        emergency_contact_name = COALESCE(EXCLUDED.emergency_contact_name, patient_profiles.emergency_contact_name),
        emergency_contact_number = COALESCE(EXCLUDED.emergency_contact_number, patient_profiles.emergency_contact_number),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [
      patientId,
      date_of_birth ? encrypt(date_of_birth) : null,
      address ? encrypt(address) : null,
      blood_group ? encrypt(blood_group) : null,
      allergies ? encrypt(allergies) : null,
      chronic_conditions ? encrypt(chronic_conditions) : null,
      emergency_contact_name ? encrypt(emergency_contact_name) : null,
      emergency_contact_number ? encrypt(emergency_contact_number) : null
    ];

    try {
      const result = await db.query(queryText, values);
      const record = result.rows[0];
      return {
        ...record,
        date_of_birth: record.date_of_birth ? decrypt(record.date_of_birth) : null,
        address: record.address ? decrypt(record.address) : null,
        blood_group: record.blood_group ? decrypt(record.blood_group) : null,
        allergies: record.allergies ? decrypt(record.allergies) : null,
        chronic_conditions: record.chronic_conditions ? decrypt(record.chronic_conditions) : null,
        emergency_contact_name: record.emergency_contact_name ? decrypt(record.emergency_contact_name) : null,
        emergency_contact_number: record.emergency_contact_number ? decrypt(record.emergency_contact_number) : null
      };
    } catch (err) {
      console.error('Error upserting patient profile:', err.message);
      throw err;
    }
  }

  static async getProfileByPatientId(patientId) {
    const queryText = 'SELECT * FROM patient_profiles WHERE patient_id = $1';
    try {
      const result = await db.query(queryText, [patientId]);
      if (result.rows.length === 0) return null;
      const record = result.rows[0];
      return {
        ...record,
        date_of_birth: record.date_of_birth ? decrypt(record.date_of_birth) : null,
        address: record.address ? decrypt(record.address) : null,
        blood_group: record.blood_group ? decrypt(record.blood_group) : null,
        allergies: record.allergies ? decrypt(record.allergies) : null,
        chronic_conditions: record.chronic_conditions ? decrypt(record.chronic_conditions) : null,
        emergency_contact_name: record.emergency_contact_name ? decrypt(record.emergency_contact_name) : null,
        emergency_contact_number: record.emergency_contact_number ? decrypt(record.emergency_contact_number) : null
      };
    } catch (err) {
      console.error('Error fetching patient profile:', err.message);
      throw err;
    }
  }
}

module.exports = PatientModel;
