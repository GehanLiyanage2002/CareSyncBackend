const db = require('./config/db');

async function check() {
  try {
    const res = await db.query('SELECT u.full_name, p.gender FROM users u LEFT JOIN patient_profiles p ON u.id = p.patient_id WHERE u.email = $1', ['kasun.bandara@test.com']);
    console.log(res.rows);
  } catch(e) {
    console.log(e);
  } finally {
    process.exit(0);
  }
}
check();
