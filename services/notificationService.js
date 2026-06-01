const db = require('../config/db');

class NotificationService {
  /**
   * Create a notification and broadcast it via Socket.IO
   * @param {Object} io - Socket.io instance
   * @param {string} userId - UUID of the user receiving the notification
   * @param {string} title - Title of the notification
   * @param {string} message - Message body
   * @param {string} type - Notification type (e.g. 'info', 'success', 'warning')
   */
  static async sendNotification(io, userId, title, message, type = 'info') {
    try {
      if (!userId) return;

      const query = `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, message, type, is_read, created_at
      `;
      const result = await db.query(query, [userId, title, message, type]);
      const notification = result.rows[0];

      if (io) {
        // Emit to the specific user's room. 
        // We assume clients join a room with their user ID upon connecting.
        io.to(userId).emit('newNotification', notification);
      }

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

module.exports = NotificationService;
