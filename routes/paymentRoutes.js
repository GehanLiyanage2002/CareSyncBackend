const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/generate-hash', paymentController.generateHash);

module.exports = router;
