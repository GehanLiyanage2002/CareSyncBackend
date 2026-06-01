const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:postgres@localhost:5432/caresync' });
client.connect().then(async () => {
  const res = await client.query("SELECT TO_CHAR(start_time, 'HH24:MI') as start_time, TO_CHAR(end_time, 'HH24:MI') as end_time, slot_duration_minutes FROM service_schedules");
  console.log(res.rows);
  client.end();
});
