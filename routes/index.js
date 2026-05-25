const express = require('express');
const router = express.Router();
const dummyRoutes = require('./dummyRoutes');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const doctorRoutes = require('./doctorRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const reviewRoutes = require('./reviewRoutes');

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
router.use('/doctor', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/reviews', reviewRoutes);

module.exports = router;
