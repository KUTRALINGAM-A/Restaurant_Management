const express = require("express");
const router = express.Router();
const pool = require("../db");

// Get daily revenue
router.get("/daily", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) AS daily_revenue FROM sales WHERE date = CURRENT_DATE"
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching daily revenue:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
