const db = require('../config/db');
const { encrypt, decrypt } = require('../utils/cryptoUtils');

class User {
  static decryptUserRecord(record) {
    if (!record) return record;
    return {
      ...record,
      mobile_number: decrypt(record.mobile_number),
      face_descriptor: decrypt(record.face_descriptor)
    };
  }

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

      -- Add missing columns for existing tables
      DO $$ BEGIN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_number TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS face_descriptor TEXT;
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
      return User.decryptUserRecord(result.rows[0]) || null;
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
      face_descriptor = null,
      is_verified = false,
      otp_code = null
    } = userData;

    const queryText = `
      INSERT INTO users
        (full_name, email, password_hash, role, mobile_number, face_descriptor, is_verified, otp_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, full_name, email, role, mobile_number, is_verified, otp_code, created_at;
    `;
    const values = [
      full_name,
      email,
      password_hash,
      role,
      encrypt(mobile_number),
      encrypt(face_descriptor),
      is_verified,
      otp_code
    ];

    try {
      const result = await db.query(queryText, values);
      return User.decryptUserRecord(result.rows[0]);
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
      return User.decryptUserRecord(result.rows[0]) || null;
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
      return User.decryptUserRecord(result.rows[0]) || null;
    } catch (err) {
      console.error('Error verifying user:', err.message);
      throw err;
    }
  }

  /**
   * Update a patient's medical profile
   * (Moved to PatientModel.js)
   */

  /**
   * Update a user's general profile
   * @param {string} id User UUID
   * @param {Object} profileData Data to update (full_name, mobile_number)
   * @returns {Object|null} Updated user
   */
  static async updateGeneralProfile(id, { full_name, mobile_number }) {
    const queryText = `
      UPDATE users 
      SET full_name = $1, mobile_number = $2
      WHERE id = $3
      RETURNING id, full_name, email, role, mobile_number, created_at;
    `;
    const values = [full_name, encrypt(mobile_number), id];

    try {
      const result = await db.query(queryText, values);
      return User.decryptUserRecord(result.rows[0]) || null;
    } catch (err) {
      console.error('Error updating general profile:', err.message);
      throw err;
    }
  }

  /**
   * Update a user's password
   * @param {string} id User UUID
   * @param {string} passwordHash New hashed password
   * @returns {boolean} Success status
   */
  static async updatePassword(id, passwordHash) {
    const queryText = `
      UPDATE users 
      SET password_hash = $1
      WHERE id = $2
      RETURNING id;
    `;
    try {
      const result = await db.query(queryText, [passwordHash, id]);
      return result.rowCount > 0;
    } catch (err) {
      console.error('Error updating password:', err.message);
      throw err;
    }
  }
}

module.exports = User;
