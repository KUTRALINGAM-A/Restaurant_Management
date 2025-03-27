require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        name: user.name,
        role: user.role
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    res.json({ 
      token, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Profile Route
router.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user data with more robust error handling
    const userQuery = `
      SELECT 
        COALESCE(name, '') as name,
        COALESCE(email, '') as email,
        COALESCE(phone, '') as phone,
        COALESCE(role, 'unassigned') as role,
        COALESCE(restaurant_id, 0) as restaurant_id
      FROM users
      WHERE id = $1
    `;
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userData = userResult.rows[0];

    // Fetch restaurant details with fallback
    const restaurantQuery = `
      SELECT 
        COALESCE(name, 'Unassigned') as restaurant_name
      FROM restaurants
      WHERE id = $1
    `;
    const restaurantResult = await pool.query(restaurantQuery, [userData.restaurant_id]);

    // Calculate profile completeness with more granular scoring
    const completenessScore = 
      (userData.name ? 25 : 0) +
      (userData.email ? 25 : 0) +
      (userData.phone ? 25 : 0) +
      (userData.role !== 'unassigned' ? 25 : 0);

    // Prepare context data with robust fallbacks
    const contextData = {
      restaurantName: restaurantResult.rows[0]?.restaurant_name || 'Unassigned',
      lastLogin: new Date().toISOString(),
      accountStatus: 'active', // Consider making this dynamic based on user status
      profileCompleteness: completenessScore
    };

    // Return combined user and context data
    res.json({
      userData,
      contextData
    });
  } catch (error) {
    console.error('Profile retrieval error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Registration Route (Optional but recommended)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUserQuery = 'SELECT * FROM users WHERE email = $1';
    const existingUserResult = await pool.query(existingUserQuery, [email]);
    
    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert new user
    const insertUserQuery = `
      INSERT INTO users (name, email, password, role) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email, role
    `;
    const newUserResult = await pool.query(insertUserQuery, [
      name, 
      email, 
      hashedPassword, 
      role || 'user'
    ]);
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUserResult.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

module.exports = router;