require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg"); // Correct import

const app = express();
const port = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(cors());
app.use(express.json());
const userRoutes = require("./routes/users");
app.use("/users", userRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Restaurant Management API is running");
});

// Import Routes
const revenueRoutes = require("./routes/revenue");
app.use("/revenue", revenueRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Export pool to use in other files
module.exports = pool;