const pool = require('./config/db.js');
async function main() {
  try {
    await pool.query(`ALTER TYPE appointment_status ADD VALUE 'In Progress';`);
    console.log('Added In Progress to enum');
  } catch (e) {
    console.log('Enum may already exist:', e.message);
  }
  
  const res1 = await pool.query(`UPDATE appointments SET status = 'In Progress' WHERE status = 'Confirmed'`);
  console.log('Appointments updated:', res1.rowCount);
  
  process.exit(0);
}
main();
