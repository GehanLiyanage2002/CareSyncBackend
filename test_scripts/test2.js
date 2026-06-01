const db = require('./config/db');

async function check() {
  const query = `
    SELECT id, service_id, TO_CHAR(schedule_date, 'YYYY-MM-DD') AS schedule_date,
           TO_CHAR(start_time, 'HH24:MI') AS start_time,
           TO_CHAR(end_time, 'HH24:MI') AS end_time,
           slot_duration_minutes
    FROM service_schedules
    ORDER BY schedule_date ASC, start_time ASC
  `;
  const result = await db.query(query);
  console.log(JSON.stringify(result.rows, null, 2));
  process.exit(0);
}

check();
