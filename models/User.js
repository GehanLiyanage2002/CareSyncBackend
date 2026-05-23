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

  // Future user methods can be added here
}

module.exports = User;
