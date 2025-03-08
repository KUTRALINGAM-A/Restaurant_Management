// Restaurant Routes with authenticateToken middleware
const express = require("express");
const pool = require("../db");
const router = express.Router();
const jwt = require("jsonwebtoken"); // Add this import
require("dotenv").config(); // If you need environment variables

// Import the same authenticateToken middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.header("Authorization");
    if (!authHeader) return res.status(403).json({ message: "Access Denied" });
    
    // Extract token from "Bearer [token]" format
    const token = authHeader.startsWith('Bearer ') ? 
                  authHeader.substring(7) : 
                  authHeader;

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid Token" });
    }
};

// Get restaurant by ID - Add authentication to this route
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT id, name, owner_name, phone, restaurant_district FROM restaurants WHERE id = $1", [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Get Restaurant Error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Other restaurant routes...

module.exports = router;