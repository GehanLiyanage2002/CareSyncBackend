const db = require('./config/db');

async function cleanup() {
  const res = await db.query("DELETE FROM users WHERE full_name = 'Dr. API Test' RETURNING id, full_name");
  console.log('Deleted:', res.rows);
  process.exit(0);
}
cleanup();
