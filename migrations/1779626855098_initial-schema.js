exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    -- CareSync Database Schema

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

    -- Create the dummy_items table
    CREATE TABLE IF NOT EXISTS dummy_items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create Doctor Profiles Schema
    CREATE TABLE IF NOT EXISTS doctor_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
      specialization VARCHAR(255),
      experience VARCHAR(255),
      bio TEXT,
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(doctor_id)
    );

    -- Create Appointments Schema
    CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
      doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
      appointment_date DATE NOT NULL,
      start_time TIME NOT NULL,
      status VARCHAR(20) CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS appointments CASCADE;
    DROP TABLE IF EXISTS doctor_profiles CASCADE;
    DROP TABLE IF EXISTS dummy_items CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
    DROP TYPE IF EXISTS user_role;
  `);
};
