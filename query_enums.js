const pool = require('./config/db.js');
async function main() {
  const res = await pool.query(`SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname IN ('appointment_status', 'service_status', 'status');`);
  console.log(res.rows);
  pool.end();
}
main();
