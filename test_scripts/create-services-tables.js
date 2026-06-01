require('dotenv').config();
const { pool } = require('./config/db');

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medical_services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_bookings (
        id SERIAL PRIMARY KEY,
        patient_id UUID REFERENCES users(id),
        service_id INTEGER REFERENCES medical_services(id),
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'Confirmed',
        amount_paid NUMERIC(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
};

createTables();
