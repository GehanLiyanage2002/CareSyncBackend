const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logger middleware
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api', routes);

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
