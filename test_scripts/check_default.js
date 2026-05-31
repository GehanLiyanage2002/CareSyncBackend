const db = require('./config/db');

async function check() {
  try {
    const res = await db.query("SELECT column_default FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'status'");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
check();
