const express = require('express');
const router = express.Router();
const TelemedicineController = require('../controllers/telemedicineController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

router.use(verifyToken);
router.post('/token', TelemedicineController.getToken);
router.post('/end', requireRole(['Doctor']), TelemedicineController.endCall);

module.exports = router;
