const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get settings for the current user
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await prisma.accessibility_settings.findUnique({
      where: { user_id: userId },
    });

    if (!settings) {
      // Return default if none exists, but we don't need to create one yet
      return res.status(200).json({ success: true, settings: {} });
    }

    res.status(200).json({ success: true, settings: settings.settings });
  } catch (error) {
    console.error('Error fetching accessibility settings:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Upsert settings for the current user
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const incomingSettings = req.body; // Expecting the full settings JSON object

    // Upsert the record
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

    res.status(200).json({ success: true, settings: updatedSettings.settings, message: 'Settings saved to cloud' });
  } catch (error) {
    console.error('Error updating accessibility settings:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
