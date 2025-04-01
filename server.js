require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional connection settings for more robust connection
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Make pool available globally as module.exports.pool
// This makes it easier to import in route files
module.exports.pool = pool;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5000'], // Adjust as needed
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Test route
app.get("/", (req, res) => {
  res.send("Restaurant Management API is running");
});

// Import and use routes
const userRoutes = require("./routes/users");
app.use("/users", userRoutes);

// Important: Mount the password reset routes at /api to match frontend API_BASE_URL
const passwordResetRoutes = require("./routes/reset_password_router");
app.use("/", passwordResetRoutes);

const restaurantRoutes = require("./routes/RestaurantRoute");
app.use('/restaurants', restaurantRoutes);

const revenueRoutes = require("./routes/revenue");
app.use("/revenue", revenueRoutes);

const menuRoutes = require("./routes/MenuRouter");
app.use("/", menuRoutes);

const billRoutes = require("./routes/BillRouter");
app.use("/bills", billRoutes);

const reportRoutes = require("./routes/bill_report_router");
app.use("/", reportRoutes);

const attendanceRoutes = require("./routes/attendance_router");
app.use("/employees", attendanceRoutes);

const billMenuRoutes = require('./routes/search_bill_router');
app.use('/', billMenuRoutes);

const userinfoRoutes = require("./routes/userinfo_router");
app.use("/", userinfoRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Handle 404 routes
app.use((req, res, next) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
});

module.exports = { app };