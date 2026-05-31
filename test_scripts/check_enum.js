const db = require('./config/db');

async function check() {
  try {
    const res = await db.query("SELECT unnest(enum_range(NULL::appointment_status))");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
check();
