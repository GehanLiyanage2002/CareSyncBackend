const express = require('express');
const router = express.Router();
const accessibilityController = require('../controllers/accessibilityController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, accessibilityController.getSettings);
router.put('/', verifyToken, accessibilityController.updateSettings);

module.exports = router;
