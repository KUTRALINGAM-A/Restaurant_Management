// Updated Users Router with logo handling functionality
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db"); // PostgreSQL connection
const multer = require("multer"); // For handling file uploads
require("dotenv").config();

const router = express.Router();

// Configure multer for image uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // Limit file size to 2MB
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

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

// Register a User (Owner, Manager, Staff) with logo support
router.post("/register", upload.single('logo'), async (req, res) => {
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

        // Process logo if uploaded
        let logoData = null;
        let logoMimeType = null;
        
        if (req.file) {
            logoData = req.file.buffer;
            logoMimeType = req.file.mimetype;
        }

        if (role === "owner") {
            // Make sure restaurants table has logo columns
            try {
                await client.query(`
                    ALTER TABLE restaurants 
                    ADD COLUMN IF NOT EXISTS logo BYTEA,
                    ADD COLUMN IF NOT EXISTS logo_mime_type VARCHAR(100);
                `);
            } catch (err) {
                console.error("Schema modification error:", err.message);
                // Continue with registration even if column addition fails
            }

            const restaurantResult = await client.query(
                "INSERT INTO restaurants (name, owner_name, phone, restaurant_district, secret_code, logo, logo_mime_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
                [restaurant_name, name, phone, restaurant_district, secret_code, logoData, logoMimeType]
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
            
            // Update restaurant logo if manager is uploading a new one
            if (role === "manager" && logoData) {
                await client.query(
                    "UPDATE restaurants SET logo = $1, logo_mime_type = $2 WHERE id = $3",
                    [logoData, logoMimeType, restaurant_id]
                );
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
            { id: newUser.rows[0].id, role: newUser.rows[0].role, restaurant_id: newRestaurantId },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(201).json({ 
            message: "User registered successfully", 
            user: newUser.rows[0], 
            token,
            hasLogo: !!logoData
        });
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

// Login User (unchanged)
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

        // Check if restaurant has a logo
        const restaurantInfo = await pool.query(
            "SELECT CASE WHEN logo IS NOT NULL THEN true ELSE false END AS has_logo FROM restaurants WHERE id = $1",
            [user.rows[0].restaurant_id]
        );

        res.status(200).json({ 
            message: "Login successful", 
            user: user.rows[0], 
            token,
            restaurantId: user.rows[0].restaurant_id,
            restaurantName: user.rows[0].restaurant_name,
            name: user.rows[0].name,
            hasLogo: restaurantInfo.rows[0]?.has_logo || false
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

// Get Restaurant Logo
router.get("/restaurant-logo/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            "SELECT logo, logo_mime_type FROM restaurants WHERE id = $1",
            [id]
        );
        
        if (result.rows.length === 0 || !result.rows[0].logo) {
            return res.status(404).json({ message: "Logo not found" });
        }
        
        const { logo, logo_mime_type } = result.rows[0];
        
        res.setHeader('Content-Type', logo_mime_type);
        res.end(logo);
    } catch (err) {
        console.error("Error retrieving logo:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Add the endpoint that the frontend is expecting
router.get("/restaurants/:id/logo", async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            "SELECT logo, logo_mime_type FROM restaurants WHERE id = $1",
            [id]
        );
        
        if (result.rows.length === 0 || !result.rows[0].logo) {
            return res.status(404).json({ message: "Logo not found" });
        }
        
        const { logo, logo_mime_type } = result.rows[0];
        
        res.setHeader('Content-Type', logo_mime_type);
        res.end(logo);
    } catch (err) {
        console.error("Error retrieving logo:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// Update Restaurant Logo (Protected, only owner/manager)
router.put("/update-logo/:restaurantId", authenticateToken, upload.single('logo'), async (req, res) => {
    const client = await pool.connect();
    try {
        const { restaurantId } = req.params;
        
        // Verify user has permission to update this restaurant
        if (req.user.restaurant_id != restaurantId || !["owner", "manager"].includes(req.user.role)) {
            return res.status(403).json({ message: "Not authorized to update this restaurant's logo" });
        }
        
        if (!req.file) {
            return res.status(400).json({ message: "No logo image provided" });
        }
        
        await client.query("BEGIN");
        
        // Update restaurant logo
        await client.query(
            "UPDATE restaurants SET logo = $1, logo_mime_type = $2 WHERE id = $3",
            [req.file.buffer, req.file.mimetype, restaurantId]
        );
        
        await client.query("COMMIT");
        
        res.status(200).json({ message: "Restaurant logo updated successfully" });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Logo Update Error:", err.message);
        res.status(500).json({ message: "Server error" });
    } finally {
        client.release();
    }
});

module.exports = router;