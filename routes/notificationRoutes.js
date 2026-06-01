const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/', NotificationController.getUserNotifications);
router.put('/read-all', NotificationController.markAllAsRead);
router.put('/:id/read', NotificationController.markAsRead);

module.exports = router;
