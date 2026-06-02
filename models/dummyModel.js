const db = require('../config/db');

class DummyModel {
  /**
   * Get the database system time to verify connection status
   */
  static async getSystemTime() {
    const result = await db.query('SELECT NOW() as current_time');
    return result.rows[0];
  }

  /**
   * Check if a dummy table exists or create it
   */
  static async setupDummyTable() {
    const queryText = `
      CREATE TABLE IF NOT EXISTS dummy_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await db.query(queryText);
    
    // Seed with dummy data if empty
    const checkEmpty = await db.query('SELECT COUNT(*) FROM dummy_items');
    if (parseInt(checkEmpty.rows[0].count, 10) === 0) {
      await db.query("INSERT INTO dummy_items (name) VALUES ('Initial CareSync Dummy Item')");
    }
  }

  /**
   * Fetch all items from the dummy table
   */
  static async getAllItems() {
    const result = await db.query('SELECT * FROM dummy_items ORDER BY id ASC');
    return result.rows;
  }
}

module.exports = DummyModel;
