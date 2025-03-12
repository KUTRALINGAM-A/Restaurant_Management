// Restaurant Routes with authenticateToken middleware
const express = require("express");
const pool = require("../db");
const router = express.Router();
const jwt = require("jsonwebtoken");
require("dotenv").config();

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

// NEW ENDPOINT: Get restaurant logo by ID
router.get("/:id/logo", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Query to get logo from the restaurants table
        const result = await pool.query("SELECT logo FROM restaurants WHERE id = $1", [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        
        const logoData = result.rows[0].logo;
        
        if (!logoData) {
            return res.status(404).json({ message: "Logo not found" });
        }
        
        // Check if logo is stored as bytea (binary data)
        if (Buffer.isBuffer(logoData)) {
            // Set the appropriate content type based on image format
            // You might want to store the image type in a separate column for more accuracy
            // For now we're assuming it's a PNG image
            res.set('Content-Type', 'image/png');
            return res.send(logoData);
        } 
        
        // If the logo is stored as a URL or base64 string instead of binary data
        return res.json({ logoUrl: logoData });
    } catch (err) {
        console.error("Get Restaurant Logo Error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Other restaurant routes...

module.exports = router;