const express = require('express');
const router = express.Router();
const dummyRoutes = require('./dummyRoutes');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
// Health check endpoint at root of /api
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    service: 'CareSync Core Backend Service'
  });
});

// Mount sub-routers
router.use('/dummy', dummyRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
