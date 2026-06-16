const pool = require('./config/db.js');
async function main() {
  try {
    await pool.query(`ALTER TYPE service_status ADD VALUE 'In Progress';`);
    console.log('Added In Progress to enum');
  } catch (e) {
    console.log('Enum may already exist:', e.message);
  }
  try {
    const res2 = await pool.query(`UPDATE service_bookings SET status = 'In Progress' WHERE status = 'Confirmed'`);
    console.log('Service bookings updated:', res2.rowCount);
  } catch(e) {
    console.log(e.message);
  }
  process.exit(0);
}
main();
