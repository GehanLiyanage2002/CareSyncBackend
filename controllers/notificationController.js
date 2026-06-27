const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

class NotificationController {
  // Fetch notifications for the current logged-in user
  static getUserNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const query = `
      SELECT id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const result = await db.query(query, [userId]);
    
    res.status(200).json(new ApiResponse(200, { notifications: result.rows }));
  });

  // Mark a specific notification as read
  static markAsRead = asyncHandler(async (req, res) => {
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
      throw new ApiError(404, 'Notification not found');
    }
    
    res.status(200).json(new ApiResponse(200, null, 'Notification marked as read'));
  });

  // Mark all notifications as read for the current user
  static markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
    `;
    await db.query(query, [userId]);
    
    res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
  });
}

module.exports = NotificationController;
