const db = require('./config/db');
async function test() {
  const patientCount = await db.query("SELECT COUNT(*) FROM users WHERE role = 'Patient'");
  console.log('patients:', patientCount.rows[0].count);
  const canceledCount = await db.query("SELECT COUNT(*) FROM appointments WHERE status = 'Cancelled'");
  console.log('canceled:', canceledCount.rows[0].count);
  const completedCount = await db.query("SELECT COUNT(*) FROM appointments WHERE status = 'Completed'");
  console.log('completed:', completedCount.rows[0].count);
  process.exit(0);
}
test();
