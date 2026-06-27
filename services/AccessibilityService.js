const db = require('../config/db');
const ApiError = require('../utils/ApiError');

class AccessibilityService {
  static async getSettings(userId) {
    const result = await db.query(
      'SELECT settings FROM accessibility_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return {};
    }
    return result.rows[0].settings;
  }

  static async updateSettings(userId, incomingSettings) {
    let result = await db.query(
      'SELECT id FROM accessibility_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      result = await db.query(
        'UPDATE accessibility_settings SET settings = $1, updated_at = NOW() WHERE user_id = $2 RETURNING settings',
        [incomingSettings, userId]
      );
    } else {
      result = await db.query(
        'INSERT INTO accessibility_settings (user_id, settings, updated_at) VALUES ($1, $2, NOW()) RETURNING settings',
        [userId, incomingSettings]
      );
    }

    return result.rows[0].settings;
  }
}

module.exports = AccessibilityService;
