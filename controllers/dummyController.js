const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const DummyModel = require('../models/dummyModel');

/**
 * Controller to handle demo and system status routes
 */
class DummyController {
  /**
   * @route   GET /api/dummy/status
   * @desc    Get server status and database connectivity status
   * @access  Public
   */
  static async getDbStatus(req, res, next) {
    try {
      let dbTime = null;
      let dbStatus = 'disconnected';

      try {
        const timeResult = await DummyModel.getSystemTime();
        dbTime = timeResult.current_time;
        dbStatus = 'connected';
      } catch (dbErr) {
        console.warn('Database connection warning (normal if PostgreSQL not running/configured yet):', dbErr.message);
      }

      res.status(200).json({
        success: true,
        message: 'CareSync Express Server is running.',
        timestamp: new Date(),
        database: {
          status: dbStatus,
          time: dbTime,
          message: dbStatus === 'connected' ? 'Connected successfully' : 'Database connection unavailable'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/dummy/items
   * @desc    Get dummy items list (creates table if missing)
   * @access  Public
   */
  static async getDummyItems(req, res, next) {
    try {
      // Run table setup if needed (safe to run multiple times, uses CREATE TABLE IF NOT EXISTS)
      try {
        await DummyModel.setupDummyTable();
      } catch (dbErr) {
        console.warn('Database setup bypassed:', dbErr.message);
        // Fallback mock items if DB not configured
        return res.status(200).json({
          success: true,
          source: 'mock_fallback',
          message: 'PostgreSQL connection unavailable. Showing mock data.',
          data: [
            { id: 1, name: 'Mock Item 1 (Database Offline)', created_at: new Date() },
            { id: 2, name: 'Mock Item 2 (Database Offline)', created_at: new Date() }
          ]
        });
      }

      const items = await DummyModel.getAllItems();
      res.status(200).json({
        success: true,
        source: 'database',
        count: items.length,
        data: items
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/dummy/auth-demo
   * @desc    Demonstrate bcryptjs hashing and jsonwebtoken token generation
   * @access  Public
   */
  static async demoAuth(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400);
        return next(new Error('Please provide both username and password'));
      }

      // Hash password using bcryptjs
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Verify the password (demonstration)
      const isMatch = await bcrypt.compare(password, hashedPassword);

      // Create JWT payload
      const payload = {
        username,
        role: 'demonstration_user',
      };

      // Sign token
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || 'supersecretjwtkey12345!',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(200).json({
        success: true,
        message: 'Authentication demo completed successfully.',
        demoDetails: {
          enteredUsername: username,
          enteredPassword: password,
          hashedPasswordSample: hashedPassword,
          passwordVerificationSuccessful: isMatch,
        },
        token: `Bearer ${token}`
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/dummy/protected-route
   * @desc    Test JWT middleware protection
   * @access  Private (Requires JWT token)
   */
  static async getProtectedRoute(req, res, next) {
    try {
      res.status(200).json({
        success: true,
        message: 'You have accessed a protected route!',
        userPayload: req.user
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DummyController;
