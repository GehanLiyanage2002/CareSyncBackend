const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const ReceptionistController = {
  /**
   * Register a walk-in patient
   * POST /api/receptionist/register-patient
   */
  registerWalkInPatient: async (req, res) => {
    try {
      const { 
        name, 
        email, 
        phone, 
        blood_group, 
        emergency_contact_name, 
        emergency_contact_number 
      } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ message: 'Name and phone number are required.' });
      }

      // Generate a dummy email if not provided
      const patientEmail = email || `walkin_${Date.now()}@caresync.local`;

      // Check if email already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [patientEmail]);

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'A user with this email already exists.' });
      }

      // Default password for walk-in patients
      const defaultPassword = 'walkin123';
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(defaultPassword, salt);

      // Create the patient user with medical details
      const result = await pool.query(
        `INSERT INTO users (
          full_name, email, password_hash, role, mobile_number, 
          blood_group, emergency_contact_name, emergency_contact_number, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          name, patientEmail, password_hash, 'Patient', phone,
          blood_group || null, emergency_contact_name || null, emergency_contact_number || null, true
        ]
      );

      const newPatient = result.rows[0];

      // Remove sensitive data before sending response
      delete newPatient.password_hash;

      return res.status(201).json({
        message: 'Walk-in patient registered successfully',
        patient: newPatient
      });
    } catch (error) {
      console.error('Error registering walk-in patient:', error);
      return res.status(500).json({ message: 'Failed to register patient. Please try again.' });
    }
  }
};

module.exports = ReceptionistController;
