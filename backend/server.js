const express = require('express');
const cors = require('cors');
const { db } = require('./config/db');

// Import Routes
const vehicleRoutes = require('./routes/vehicleRoutes');
const driverRoutes = require('./routes/driverRoutes');
const tripRoutes = require('./routes/tripRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes Binding
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api', analyticsRoutes); // Binds /api/kpis and /api/reports

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'TransitOps Backend Server is running smoothly.' });
});

// 404 Route Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'API endpoint not found.' });
});

// Global Error Handler Middleware
// Handles SQLite constraint errors, validation failures, and operational bugs securely.
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);

  // Handle SQLite specific errors
  if (err.message && err.message.includes('SQLITE_CONSTRAINT')) {
    // Unique key violations
    if (err.message.includes('UNIQUE')) {
      return res.status(400).json({
        success: false,
        error: 'Database constraint error: A record with duplicate unique fields already exists.'
      });
    }
    // Check constraints violations
    if (err.message.includes('CHECK')) {
      return res.status(400).json({
        success: false,
        error: 'Database validation check failed: Submitted input violates business bounds.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Database constraint violation: ${err.message}`
    });
  }

  // Default operational error
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: message
  });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`TransitOps Express server is listening on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`==================================================`);
});

// Handle safe shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.close((err) => {
      if (err) console.error('Error closing SQLite DB:', err.message);
      else console.log('SQLite database connection closed safely.');
      process.exit(0);
    });
  });
});
