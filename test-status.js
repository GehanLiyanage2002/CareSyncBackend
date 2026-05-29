const db = require('./config/db');

async function test() {
  const c = await db.query("SELECT status FROM appointments");
  console.log(c.rows);
  process.exit(0);
}
test();
