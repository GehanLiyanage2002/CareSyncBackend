const db = require('./config/db');

async function fixEnum() {
  try {
    await db.query("ALTER TYPE appointment_status RENAME VALUE 'Upcoming' TO 'Pending';");
    await db.query("ALTER TYPE appointment_status RENAME VALUE 'In Progress' TO 'Confirmed';");
    console.log("Enum values renamed successfully.");
  } catch (err) {
    console.error("Error renaming enum:", err);
  } finally {
    process.exit();
  }
}
fixEnum();
