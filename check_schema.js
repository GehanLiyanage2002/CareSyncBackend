const db = require('./config/db');

async function check() {
  try {
    const res = await db.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'appointments'");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
check();
