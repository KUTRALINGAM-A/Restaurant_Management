require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Restaurant Management API is running");
});

// Import and use routes
const userRoutes = require("./routes/users");
app.use("/users", userRoutes);

const restaurantRoutes = require("./routes/RestaurantRoute");
app.use('/restaurants', restaurantRoutes);

const revenueRoutes = require("./routes/revenue");
app.use("/revenue", revenueRoutes);

// Add menu routes - this will handle the dynamic table names
const menuRoutes = require("./routes/MenuRouter");
app.use("/", menuRoutes);

const billRoutes = require("./routes/BillRouter");
app.use("/bills", billRoutes);

// Reports and analytics routes
const reportRoutes = require("./routes/bill_report_router");
app.use("/", reportRoutes);

// Important: Mount the attendance router at /api to match frontend expectations
const attendanceRoutes = require("./routes/attendance_router");
app.use("/employees", attendanceRoutes);

// Handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Export pool to use in other files
module.exports = pool;