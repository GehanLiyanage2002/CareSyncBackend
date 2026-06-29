const db = require('../config/db');

class ContactMessage {
  /**
   * Initializes the contact_messages table with the required schema
   */
  static async setupContactMessagesTable() {
    const queryText = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      DO $$ BEGIN
          CREATE TYPE message_status AS ENUM ('unread', 'read');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS contact_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status message_status DEFAULT 'unread',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    try {
      await db.query(queryText);
      console.log('Contact Messages table setup successfully');
    } catch (err) {
      console.error('Error setting up Contact Messages table:', err);
      throw err;
    }
  }

  static async createMessage(data) {
    const { name, email, subject, message } = data;
    const query = `
      INSERT INTO contact_messages (name, email, subject, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await db.query(query, [name, email, subject, message]);
    return result.rows[0];
  }

  static async getAllMessages() {
    const query = `
      SELECT * FROM contact_messages
      ORDER BY created_at DESC;
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async markAsRead(id) {
    const query = `
      UPDATE contact_messages
      SET status = 'read'
      WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async deleteMessage(id) {
    const query = `
      DELETE FROM contact_messages
      WHERE id = $1
      RETURNING *;
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = ContactMessage;
