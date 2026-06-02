const db = require('./config/db');

async function check() {
  try {
    const res = await db.query("SELECT event_object_table, trigger_name, action_statement FROM information_schema.triggers WHERE event_object_table = 'appointments'");
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
check();
