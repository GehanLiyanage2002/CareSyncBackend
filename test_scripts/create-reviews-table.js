// One-time script to create the reviews table
require('dotenv').config();
const db = require('./config/db');

async function createReviewsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE UNIQUE,
        patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        patient_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ reviews table created successfully');
  } catch (err) {
    console.error('❌ Error creating reviews table:', err.message);
  } finally {
    process.exit(0);
  }
}

createReviewsTable();
