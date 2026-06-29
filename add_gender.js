const db = require('./config/db');

async function addGender() {
  try {
    await db.query(`ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS gender TEXT;`);
    console.log("Column gender added to patient_profiles successfully.");
  } catch (err) {
    console.error("Error adding column:", err);
  } finally {
    process.exit(0);
  }
}

addGender();
