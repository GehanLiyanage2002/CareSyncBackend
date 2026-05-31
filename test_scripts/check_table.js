const db = require('./config/db');

async function check() {
  try {
    const res = await db.query("SELECT table_type FROM information_schema.tables WHERE table_name = 'appointments'");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
check();
