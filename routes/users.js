// Updated Users Router with fixed authenticateToken middleware
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db"); // PostgreSQL connection
require("dotenv").config();

const router = express.Router();

// Fixed Middleware for JWT Authentication
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

// Register a User (Owner, Manager, Staff)
router.post("/register", async (req, res) => {
    const client = await pool.connect();
    try {
        const { name, email, phone, password, role, restaurant_name, restaurant_district, restaurant_id, secret_code } = req.body;

        if (!["owner", "manager", "staff"].includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be 'owner', 'manager', or 'staff'." });
        }

        const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        let newRestaurantId = restaurant_id;
        await client.query("BEGIN");

        if (role === "owner") {
            const restaurantResult = await client.query(
                "INSERT INTO restaurants (name, owner_name, phone, restaurant_district, secret_code) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                [restaurant_name, name, phone, restaurant_district, secret_code]
            );
            newRestaurantId = restaurantResult.rows[0].id;

            await client.query(`
                CREATE TABLE "employees_${newRestaurantId}" (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    email VARCHAR UNIQUE NOT NULL,
                    phone VARCHAR NOT NULL,
                    role VARCHAR CHECK (role IN ('owner', 'manager', 'staff')) NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);

            await client.query(
                `INSERT INTO "employees_${newRestaurantId}" (name, email, phone, role) VALUES ($1, $2, $3, $4)`,
                [name, email, phone, "owner"]
            );

            await client.query(`
                CREATE TABLE "menu_${newRestaurantId}" (
                    id SERIAL PRIMARY KEY,
                    item_name VARCHAR NOT NULL,
                    description TEXT,
                    price DECIMAL NOT NULL,
                    category VARCHAR NOT NULL,
                    available BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);
        } else {
            if (!restaurant_id || !secret_code) {
                return res.status(400).json({ message: "Manager and staff must provide a valid restaurant_id and secret_code." });
            }

            const restaurant = await pool.query("SELECT secret_code FROM restaurants WHERE id = $1", [restaurant_id]);
            if (restaurant.rows.length === 0) {
                return res.status(400).json({ message: "Invalid Restaurant ID." });
            }

            if (restaurant.rows[0].secret_code !== secret_code) {
                return res.status(403).json({ message: "Invalid secret code." });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await client.query(
            "INSERT INTO users (name, email, phone, password, role, restaurant_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [name, email, phone, hashedPassword, role, newRestaurantId]
        );

        if (role !== "owner") {
            await client.query(
                `INSERT INTO "employees_${newRestaurantId}" (name, email, phone, role) VALUES ($1, $2, $3, $4)`,
                [name, email, phone, role]
            );
        }

        await client.query("COMMIT");

        const token = jwt.sign(
            { id: newUser.rows[0].id, role: newUser.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({ message: "User registered successfully", user: newUser.rows[0], token });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Registration Error:", err.message);
        if (!res.headersSent) {
            res.status(500).json({ message: "Server error" });
        }
    } finally {
        client.release();
    }
});

// Login User
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await pool.query(
            "SELECT u.*, r.name AS restaurant_name FROM users u " +
            "JOIN restaurants r ON u.restaurant_id = r.id " +
            "WHERE u.email = $1", 
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ message: "User not found" });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { 
                id: user.rows[0].id, 
                role: user.rows[0].role,
                restaurant_id: user.rows[0].restaurant_id
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ 
            message: "Login successful", 
            user: user.rows[0], 
            token,
            restaurantId: user.rows[0].restaurant_id,
            restaurantName: user.rows[0].restaurant_name,
            name: user.rows[0].name // Added name directly in login response
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Get User Profile (Protected Route)
router.get("/profile", authenticateToken, async (req, res) => {
    try {
        const user = await pool.query("SELECT id, name, email, phone, role, restaurant_id FROM users WHERE id = $1", [req.user.id]);
        res.status(200).json(user.rows[0]);
    } catch (err) {
        console.error("Profile Error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;