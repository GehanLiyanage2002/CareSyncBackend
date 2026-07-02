const express = require('express');
const router = express.Router();
const accessibilityController = require('../controllers/accessibilityController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, requireRole(['Patient']), accessibilityController.getSettings);
router.put('/', verifyToken, requireRole(['Patient']), accessibilityController.updateSettings);

module.exports = router;
