const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ accelerateUrl: process.env.DATABASE_URL });
const ApiError = require('../utils/ApiError');

class AccessibilityService {
  static async getSettings(userId) {
    let settings = await prisma.accessibility_settings.findUnique({
      where: { user_id: userId },
    });

    if (!settings) {
      return {};
    }
    return settings.settings;
  }

  static async updateSettings(userId, incomingSettings) {
    const updatedSettings = await prisma.accessibility_settings.upsert({
      where: { user_id: userId },
      update: {
        settings: incomingSettings,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        settings: incomingSettings,
      },
    });

    return updatedSettings.settings;
  }
}

module.exports = AccessibilityService;
