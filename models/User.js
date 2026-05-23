const db = require('../config/db');

class User {
  /**
   * Initializes the Users table with the required schema
   */
  static async setupUsersTable() {
    const queryText = `
      -- Enable uuid-ossp extension for UUID generation if it doesn't exist
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Create an ENUM type for user roles if it doesn't exist
      DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('Patient', 'Doctor', 'Receptionist', 'Admin');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;

      -- Create the users table
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role user_role NOT NULL,
        mobile_number VARCHAR(20),
        blood_group VARCHAR(10),
        allergies TEXT,
        face_descriptor TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        otp_code VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Add is_verified column if it doesn't exist (for existing tables)
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
      EXCEPTION WHEN others THEN null;
      END $$;

      -- Add otp_code column if it doesn't exist (for existing tables)
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR(10);
      EXCEPTION WHEN others THEN null;
      END $$;
    `;
    
    try {
      await db.query(queryText);
      console.log('✅ Users table initialized successfully with new schema.');
    } catch (err) {
      console.warn('⚠️ Warning: Could not initialize users table. (Normal if DB is offline):', err.message);
    }
  }

  /**
   * Find a user by their email address
   * @param {string} email 
   * @returns {Object|null}
   */
  static async findByEmail(email) {
    const queryText = 'SELECT * FROM users WHERE email = $1';
    try {
      const result = await db.query(queryText, [email]);
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error finding user by email:', err.message);
      throw err;
    }
  }

  /**
   * Create a new user in the database
   * @param {Object} userData
   * @returns {Object} Created user
   */
  static async createUser(userData) {
    const {
      full_name,
      email,
      password_hash,
      role,
      mobile_number = null,
      blood_group = null,
      allergies = null,
      face_descriptor = null,
      is_verified = false,
      otp_code = null
    } = userData;

    const queryText = `
      INSERT INTO users
        (full_name, email, password_hash, role, mobile_number, blood_group, allergies, face_descriptor, is_verified, otp_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, full_name, email, role, mobile_number, blood_group, allergies, is_verified, otp_code, created_at;
    `;
    const values = [
      full_name,
      email,
      password_hash,
      role,
      mobile_number,
      blood_group,
      allergies,
      face_descriptor,
      is_verified,
      otp_code
    ];

    try {
      const result = await db.query(queryText, values);
      return result.rows[0];
    } catch (err) {
      console.error('Error creating user:', err.message);
      throw err;
    }
  }

  /**
   * Find a user by their UUID
   * @param {string} id - User UUID
   * @returns {Object|null}
   */
  static async findById(id) {
    const queryText = 'SELECT * FROM users WHERE id = $1';
    try {
      const result = await db.query(queryText, [id]);
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error finding user by id:', err.message);
      throw err;
    }
  }

  /**
   * Store an OTP code for a user (for email verification)
   * @param {string} email - User email
   * @param {string} otp - Generated OTP code
   * @returns {Object|null}
   */
  static async setOtp(email, otp) {
    const queryText = `
      UPDATE users
      SET otp_code = $1
      WHERE email = $2
      RETURNING id, email, otp_code;
    `;
    try {
      const result = await db.query(queryText, [otp, email]);
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error setting OTP:', err.message);
      throw err;
    }
  }

  /**
   * Verify a user's email by clearing the OTP and setting is_verified = true
   * @param {string} email - User email
   * @returns {Object|null} Updated user
   */
  static async verifyUser(email) {
    const queryText = `
      UPDATE users
      SET is_verified = TRUE, otp_code = NULL
      WHERE email = $1
      RETURNING id, full_name, email, role, is_verified, created_at;
    `;
    try {
      const result = await db.query(queryText, [email]);
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error verifying user:', err.message);
      throw err;
    }
  }

  /**
   * Update a patient's medical profile
   * @param {string} id User UUID
   * @param {Object} profileData Data to update
   * @returns {Object|null} Updated user
   */
  static async updatePatientProfile(id, { blood_group, allergies }) {
    const queryText = `
      UPDATE users 
      SET blood_group = $1, allergies = $2 
      WHERE id = $3 AND role = 'Patient'
      RETURNING id, full_name, email, role, blood_group, allergies, created_at;
    `;
    const values = [blood_group, allergies, id];

    try {
      const result = await db.query(queryText, values);
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error updating patient profile:', err.message);
      throw err;
    }
  }
}

module.exports = User;
