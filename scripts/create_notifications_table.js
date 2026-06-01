const db = require('../config/db');

async function createNotificationsTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("Notifications table created successfully!");
  } catch (e) {
    console.error("Error creating table:", e);
  } finally {
    process.exit(0);
  }
}

createNotificationsTable();
