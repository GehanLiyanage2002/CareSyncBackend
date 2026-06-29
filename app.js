const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// Global Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1500, // Limit each IP to 1500 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Simple logger middleware
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api', apiLimiter, routes);

// Base landing route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to CareSync API Server!',
    documentation: 'See project README or API collection for routes.',
    status: 'Running'
  });
});

// 404 Catch-all handler for unknown endpoints
app.use((req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
});

// Centralized error handler middleware
app.use(errorHandler);

module.exports = app;
