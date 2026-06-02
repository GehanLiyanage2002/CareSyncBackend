const db = require('../config/db');

async function alterTable() {
  try {
    await db.query(`
      ALTER TABLE service_schedules
      ADD COLUMN IF NOT EXISTS day_of_week VARCHAR(20),
      ALTER COLUMN schedule_date DROP NOT NULL,
      ALTER COLUMN slot_duration_minutes DROP NOT NULL;
    `);
    console.log("Table altered successfully!");
  } catch (e) {
    console.error("Error altering table:", e);
  } finally {
    process.exit(0);
  }
}

alterTable();
