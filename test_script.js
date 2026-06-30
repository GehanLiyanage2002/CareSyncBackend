require('dotenv').config();
const db = require('./config/db');

async function test() {
  try {
    const query = `
      SELECT 
        u.id as doctor_id, 
        u.full_name as name, 
        (SELECT COUNT(DISTINCT patient_id)::int FROM appointments WHERE doctor_id = u.id AND status::text != 'Cancelled') as patients
      FROM users u
      LEFT JOIN doctor_profiles dp ON u.id = dp.doctor_id
      WHERE u.role = 'Doctor' AND dp.is_approved = true
    `;
    console.log('Running query...');
    const result = await db.query(query);
    console.log('Success!', result.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
test();
