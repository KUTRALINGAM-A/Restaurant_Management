const express = require('express');
const router = express.Router();
// Fixed import path to use the dedicated db.js file
const pool = require('../db'); 

// Get categories for a restaurant
router.get('/menu_:restaurantId/category', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tableName = `menu_${restaurantId}`;
    
    console.log(`Attempting to fetch categories from table: ${tableName}`);
    
    // Check if table exists first
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )`, [tableName]
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log(`Table ${tableName} does not exist`);
      return res.status(404).json({ message: `Table ${tableName} does not exist` });
    }
    
    console.log(`Table ${tableName} exists, fetching categories`);
    
    // Now try to fetch categories
    const result = await pool.query(`SELECT DISTINCT category FROM "${tableName}"`);
    const categories = result.rows.map(row => row.category);
    
    console.log(`Found categories:`, categories);
    res.json(categories);
  } catch (err) {
    console.error(`Error fetching categories from ${req.params.restaurantId}:`, err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      stack: err.stack
    });
  }
});

// Add new menu item
router.post('/menu_:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tableName = `menu_${restaurantId}`;
    const { item_name, description, price, category, available } = req.body;
    
    console.log(`Attempting to add item to table: ${tableName}`);
    console.log(`Request body:`, req.body);
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )`, [tableName]
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log(`Table ${tableName} does not exist`);
      return res.status(404).json({ message: `Table ${tableName} does not exist` });
    }
    
    console.log(`Table ${tableName} exists`);
    
    // Now try to insert
    console.log(`Inserting item: ${item_name} into ${tableName}`);
    
    const result = await pool.query(
      `INSERT INTO "${tableName}" (item_name, description, price, category, available) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [item_name, description, price, category, available]
    );
    
    console.log(`Item added successfully:`, result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(`Error adding menu item to ${req.params.restaurantId}:`, err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      stack: err.stack
    });
  }
});

// Get all menu items for a restaurant
router.get('/menu_:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tableName = `menu_${restaurantId}`;
    
    console.log(`Attempting to fetch items from table: ${tableName}`);
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )`, [tableName]
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log(`Table ${tableName} does not exist`);
      return res.status(404).json({ message: `Table ${tableName} does not exist` });
    }
    
    const result = await pool.query(`SELECT * FROM "${tableName}"`);
    console.log(`Found ${result.rows.length} items in ${tableName}`);
    res.json(result.rows);
  } catch (err) {
    console.error(`Error fetching menu items from ${req.params.restaurantId}:`, err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      stack: err.stack
    });
  }
});

// Update menu item for a restaurant
router.put('/menu_:restaurantId/:itemId', async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const tableName = `menu_${restaurantId}`;
    const { item_name, description, price, category, available } = req.body;
    
    console.log(`Attempting to update item ${itemId} in table: ${tableName}`);
    console.log(`Request body:`, req.body);
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )`, [tableName]
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log(`Table ${tableName} does not exist`);
      return res.status(404).json({ message: `Table ${tableName} does not exist` });
    }
    
    // Check if the item exists
    const checkItem = await pool.query(
      `SELECT * FROM "${tableName}" WHERE id = $1`,
      [itemId]
    );
    
    if (checkItem.rows.length === 0) {
      console.log(`Item ${itemId} not found in ${tableName}`);
      return res.status(404).json({ message: `Item not found` });
    }
    
    // Update the item
    const result = await pool.query(
      `UPDATE "${tableName}" 
       SET item_name = $1, description = $2, price = $3, category = $4, available = $5
       WHERE id = $6 
       RETURNING *`,
      [item_name, description, price, category, available, itemId]
    );
    
    console.log(`Item ${itemId} updated successfully in ${tableName}`);
    res.json({
      message: 'Item updated successfully',
      updatedItem: result.rows[0]
    });
  } catch (err) {
    console.error(`Error updating menu item ${req.params.itemId} in ${req.params.restaurantId}:`, err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      stack: err.stack
    });
  }
});

// Delete menu item from a restaurant
router.delete('/menu_:restaurantId/:itemId', async (req, res) => {
  try {
    const { restaurantId, itemId } = req.params;
    const tableName = `menu_${restaurantId}`;
    
    console.log(`Attempting to delete item ${itemId} from table: ${tableName}`);
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      )`, [tableName]
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log(`Table ${tableName} does not exist`);
      return res.status(404).json({ message: `Table ${tableName} does not exist` });
    }
    
    // First check if the item exists
    const checkItem = await pool.query(
      `SELECT * FROM "${tableName}" WHERE id = $1`,
      [itemId]
    );
    
    if (checkItem.rows.length === 0) {
      console.log(`Item ${itemId} not found in ${tableName}`);
      return res.status(404).json({ message: `Item not found` });
    }
    
    // Now delete the item
    const result = await pool.query(
      `DELETE FROM "${tableName}" WHERE id = $1 RETURNING *`,
      [itemId]
    );
    
    console.log(`Item ${itemId} deleted successfully from ${tableName}`);
    res.json({ 
      message: 'Item deleted successfully', 
      deletedItem: result.rows[0] 
    });
  } catch (err) {
    console.error(`Error deleting menu item ${req.params.itemId} from ${req.params.restaurantId}:`, err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message,
      stack: err.stack
    });
  }
});

module.exports = router;