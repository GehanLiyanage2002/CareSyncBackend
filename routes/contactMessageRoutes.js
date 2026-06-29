const express = require('express');
const router = express.Router();
const contactMessageController = require('../controllers/contactMessageController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Public route to submit a message
router.post('/', contactMessageController.submitMessage);

// Protected routes (Admin and Receptionist only)
router.use(verifyToken);
router.use(requireRole(['Admin', 'Receptionist']));

router.get('/', contactMessageController.getMessages);
router.put('/:id/read', contactMessageController.markAsRead);
router.delete('/:id', contactMessageController.deleteMessage);
router.post('/:id/reply', contactMessageController.replyMessage);

module.exports = router;
