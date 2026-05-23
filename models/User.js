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
        blood_group VARCHAR(10),
        allergies TEXT,
        face_descriptor TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
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
    const { full_name, email, password_hash, role, blood_group = null, allergies = null, face_descriptor = null } = userData;
    const queryText = `
      INSERT INTO users (full_name, email, password_hash, role, blood_group, allergies, face_descriptor)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, full_name, email, role, blood_group, allergies, created_at;
    `;
    const values = [full_name, email, password_hash, role, blood_group, allergies, face_descriptor];

    try {
      const result = await db.query(queryText, values);
      return result.rows[0];
    } catch (err) {
      console.error('Error creating user:', err.message);
      throw err;
    }
  }
}

module.exports = User;
