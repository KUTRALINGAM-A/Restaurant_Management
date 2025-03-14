const express = require("express");
const router = express.Router();
const pool = require("../db"); // PostgreSQL connection
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware for JWT Authentication
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

// Get all menu items for a restaurant
router.get("/:restaurantId", authenticateToken, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        
        // Verify user has access to this restaurant's data
        if (req.user.restaurant_id != restaurantId) {
            return res.status(403).json({ message: "Not authorized to access this restaurant's menu" });
        }
        
        const result = await pool.query(
            `SELECT * FROM "menu_${restaurantId}" ORDER BY category, item_name`
        );
        
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Menu fetch error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Add a new menu item
router.post("/:restaurantId", authenticateToken, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { item_name, description, price, category, available } = req.body;
        
        // Verify user has permission to modify this restaurant's menu
        if (req.user.restaurant_id != restaurantId || !["owner", "manager"].includes(req.user.role)) {
            return res.status(403).json({ message: "Not authorized to modify this restaurant's menu" });
        }
        
        // Validate required fields
        if (!item_name || !price || !category) {
            return res.status(400).json({ message: "Item name, price, and category are required" });
        }
        
        // Validate price is a valid number
        if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            return res.status(400).json({ message: "Price must be a valid positive number" });
        }
        
        // Add console logs to debug
        console.log(`Inserting into menu_${restaurantId}:`, { item_name, description, price, category, available });
        
        const tableName = `menu_${restaurantId}`;
        const query = `INSERT INTO "${tableName}" (item_name, description, price, category, available) 
                      VALUES ($1, $2, $3, $4, $5) RETURNING *`;
        
        console.log("Executing query:", query);
        
        const result = await pool.query(
            query,
            [item_name, description || '', parseFloat(price), category, available !== undefined ? available : true]
        );
        
        console.log("Insert result:", result.rows[0]);
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Menu item add error:", err);  // Log the full error, not just the message
        // Send more detailed error information in development
        res.status(500).json({ 
            message: "Server error", 
            error: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
});

// Update an existing menu item
router.put("/:restaurantId/:itemId", authenticateToken, async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;
        const { item_name, description, price, category, available } = req.body;
        
        // Verify user has permission to modify this restaurant's menu
        if (req.user.restaurant_id != restaurantId || !["owner", "manager"].includes(req.user.role)) {
            return res.status(403).json({ message: "Not authorized to modify this restaurant's menu" });
        }
        
        // Validate required fields
        if (!item_name || !price || !category) {
            return res.status(400).json({ message: "Item name, price, and category are required" });
        }
        
        // Validate price is a valid number
        if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            return res.status(400).json({ message: "Price must be a valid positive number" });
        }
        
        // Check if item exists
        const checkResult = await pool.query(
            `SELECT id FROM "menu_${restaurantId}" WHERE id = $1`,
            [itemId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        
        const result = await pool.query(
            `UPDATE "menu_${restaurantId}" 
             SET item_name = $1, description = $2, price = $3, category = $4, available = $5
             WHERE id = $6 RETURNING *`,
            [item_name, description || '', parseFloat(price), category, available !== undefined ? available : true, itemId]
        );
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Menu item update error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Delete a menu item
router.delete("/:restaurantId/:itemId", authenticateToken, async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;
        
        // Verify user has permission to modify this restaurant's menu
        if (req.user.restaurant_id != restaurantId || !["owner", "manager"].includes(req.user.role)) {
            return res.status(403).json({ message: "Not authorized to modify this restaurant's menu" });
        }
        
        // Check if item exists
        const checkResult = await pool.query(
            `SELECT id FROM "menu_${restaurantId}" WHERE id = $1`,
            [itemId]
        );
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        
        const result = await pool.query(
            `DELETE FROM "menu_${restaurantId}" WHERE id = $1 RETURNING *`,
            [itemId]
        );
        
        res.status(200).json({ message: "Menu item deleted successfully", item: result.rows[0] });
    } catch (err) {
        console.error("Menu item delete error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Get menu items by category
router.get("/:restaurantId/category/:categoryName", authenticateToken, async (req, res) => {
    try {
        const { restaurantId, categoryName } = req.params;
        
        // Verify user has access to this restaurant's data
        if (req.user.restaurant_id != restaurantId) {
            return res.status(403).json({ message: "Not authorized to access this restaurant's menu" });
        }
        
        const result = await pool.query(
            `SELECT * FROM "menu_${restaurantId}" WHERE category = $1 ORDER BY item_name`,
            [categoryName]
        );
        
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Menu category fetch error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Get all unique categories for a restaurant
router.get("/:restaurantId/categories", authenticateToken, async (req, res) => {
    try {
        const { restaurantId } = req.params;
        
        // Verify user has access to this restaurant's data
        if (req.user.restaurant_id != restaurantId) {
            return res.status(403).json({ message: "Not authorized to access this restaurant's menu" });
        }
        
        const result = await pool.query(
            `SELECT DISTINCT category FROM "menu_${restaurantId}" ORDER BY category`
        );
        
        const categories = result.rows.map(row => row.category);
        res.status(200).json(categories);
    } catch (err) {
        console.error("Categories fetch error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Update menu item availability
router.patch("/:restaurantId/:itemId/availability", authenticateToken, async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;
        const { available } = req.body;
        
        // Verify user has permission to modify this restaurant's menu
        if (req.user.restaurant_id != restaurantId || !["owner", "manager", "staff"].includes(req.user.role)) {
            return res.status(403).json({ message: "Not authorized to modify this restaurant's menu" });
        }
        
        if (available === undefined) {
            return res.status(400).json({ message: "Available status is required" });
        }
        
        const result = await pool.query(
            `UPDATE "menu_${restaurantId}" SET available = $1 WHERE id = $2 RETURNING *`,
            [available, itemId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error("Menu item availability update error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;