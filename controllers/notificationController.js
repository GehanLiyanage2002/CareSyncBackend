const db = require('../config/db');

class NotificationController {
  // Fetch notifications for the current logged-in user
  static async getUserNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT id, title, message, type, is_read, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `;
      const result = await db.query(query, [userId]);
      
      res.status(200).json({
        success: true,
        notifications: result.rows
      });
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      next(error);
    }
  }

  // Mark a specific notification as read
  static async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      
      const query = `
        UPDATE notifications
        SET is_read = true
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;
      const result = await db.query(query, [id, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }
      
      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error in markAsRead:', error);
      next(error);
    }
  }

  // Mark all notifications as read for the current user
  static async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      
      const query = `
        UPDATE notifications
        SET is_read = true
        WHERE user_id = $1 AND is_read = false
      `;
      await db.query(query, [userId]);
      
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      next(error);
    }
  }
}

module.exports = NotificationController;
