require('dotenv').config();
const { pool } = require('./config/db');
const bcrypt = require('bcryptjs');

async function createReceptionist() {
  try {
    const email = 'receptionist';
    const password = 'password123';
    
    // Check if exists
    const checkUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      console.log('Receptionist user already exists. Updating password just in case...');
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [password_hash, email]);
      console.log('Password updated successfully.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      ['Front Desk Receptionist', email, password_hash, 'Receptionist']
    );
    console.log('Receptionist user created successfully:', result.rows[0].email);
  } catch (err) {
    console.error('Error creating receptionist:', err);
  } finally {
    pool.end();
  }
}

createReceptionist();
