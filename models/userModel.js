const db = require('../config/db');

class UserModel {
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
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role user_role NOT NULL,
        profile_completed BOOLEAN DEFAULT FALSE,
        face_descriptor TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await db.query(queryText);
      console.log('Users table initialized successfully.');
    } catch (err) {
      console.warn('Warning: Could not initialize users table. (Normal if DB is offline):', err.message);
    }
  }

  /**
   * Find a user by email
   * @param {string} email 
   * @returns {Object|null} User record or null
   */
  static async findByEmail(email) {
    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } catch (err) {
      console.error('Error finding user by email:', err.message);
      throw err;
    }
  }

  /**
   * Create a new user
   * @param {Object} userData 
   * @returns {Object} Created user record
   */
  static async createUser(userData) {
    const { name, email, password_hash, role, profile_completed = false, face_descriptor = null } = userData;
    const queryText = `
      INSERT INTO users (name, email, password_hash, role, profile_completed, face_descriptor)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role, profile_completed, created_at;
    `;
    const values = [name, email, password_hash, role, profile_completed, face_descriptor];

    try {
      const result = await db.query(queryText, values);
      return result.rows[0];
    } catch (err) {
      console.error('Error creating user:', err.message);
      throw err;
    }
  }
}

module.exports = UserModel;
