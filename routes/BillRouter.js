const express = require('express');
const router = express.Router();
const pool = require('../db'); // Assuming you have a database connection file
// Temporary auth middleware (replace with real auth later)
const auth = (req, res, next) => next(); // Assuming you have an auth middleware

// Create a new bill
router.post('/', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      restaurant_id,
      bill_number,
      bill_date,
      employee_name,
      customer_name,
      customer_phone,
      payment_method,
      items,
      total_amount
    } = req.body;
    
    // Get employee_id from token or use a default if not available
    const employee_id = req.user ? req.user.id : 1; // Use default if not available
    
    // Use restaurant_id from request body for the table name
    const billResult = await client.query(
      `INSERT INTO bills_${restaurant_id}
       (restaurant_id, bill_number, bill_date, employee_id, employee_name, 
        customer_name, customer_phone, payment_method, total_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [restaurant_id, bill_number, bill_date, employee_id, employee_name, 
       customer_name, customer_phone, payment_method, total_amount]
    );
    
    const billId = billResult.rows[0].id;
    
    // Also fix this line to use restaurant_id from the request body
    for (const item of items) {
      await client.query(
        `INSERT INTO bill_items_${restaurant_id}
         (bill_id, item_id, item_name, quantity, price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [billId, item.item_id, item.item_name, item.quantity, item.price, item.subtotal]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(201).json({ 
      success: true, 
      message: "Bill created successfully", 
      billId: billId 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error creating bill:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create bill", 
      error: error.message 
    });
  } finally {
    client.release();
  }
});

// Get bills count for a specific day
router.get('/count/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required"
      });
    }
    
    // Parse the date string to create date range for that day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const result = await pool.query(
      `SELECT COUNT(*) FROM bills_${restaurantId} 
       WHERE restaurant_id = $1 
       AND bill_date BETWEEN $2 AND $3`,
      [restaurantId, startDate, endDate]
    );
    
    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error("Error getting bill count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get bill count",
      error: error.message
    });
  }
});

// Get all bills for a restaurant
router.get('/restaurant/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate, limit, offset } = req.query;
    
    let query = `
      SELECT b.*, COUNT(bi.id) as item_count
      FROM bills_${restaurantId} b
      LEFT JOIN bill_items_${restaurantId} bi ON b.id = bi.bill_id
      WHERE b.restaurant_id = $1`;
    
    const queryParams = [restaurantId];
    let paramCount = 2;
    
    // Add date range filter if provided
    if (startDate && endDate) {
      query += ` AND b.bill_date BETWEEN $${paramCount} AND $${paramCount + 1}`;
      queryParams.push(new Date(startDate), new Date(endDate));
      paramCount += 2;
    }
    
    query += ` GROUP BY b.id ORDER BY b.bill_date DESC`;
    
    // Add pagination if provided
    if (limit) {
      query += ` LIMIT $${paramCount}`;
      queryParams.push(parseInt(limit));
      paramCount++;
      
      if (offset) {
        query += ` OFFSET $${paramCount}`;
        queryParams.push(parseInt(offset));
      }
    }
    
    const result = await pool.query(query, queryParams);
    
    res.json({
      success: true,
      bills: result.rows
    });
  } catch (error) {
    console.error("Error getting bills:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get bills",
      error: error.message
    });
  }
});

// Get a specific bill with its items
router.get('/:billId', auth, async (req, res) => {
  try {
    const { billId } = req.params;
    const restaurantId = req.query.restaurantId;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: "Restaurant ID is required as a query parameter"
      });
    }
    
    // Get bill information
    const billResult = await pool.query(
      `SELECT * FROM bills_${restaurantId} WHERE id = $1`,
      [billId]
    );
    
    if (billResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Bill not found"
      });
    }
    
    // Get bill items
    const itemsResult = await pool.query(
      `SELECT * FROM bill_items_${restaurantId} WHERE bill_id = $1`,
      [billId]
    );
    
    res.json({
      success: true,
      bill: billResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error("Error getting bill details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get bill details",
      error: error.message
    });
  }
});

// Get bills for a specific date range
router.get('/date-range/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }
    
    const result = await pool.query(
      `SELECT b.*, 
              COUNT(bi.id) as items_count, 
              SUM(bi.quantity) as total_items
       FROM bills_${restaurantId} b
       LEFT JOIN bill_items_${restaurantId} bi ON b.id = bi.bill_id
       WHERE b.restaurant_id = $1 
       AND b.bill_date BETWEEN $2 AND $3
       GROUP BY b.id
       ORDER BY b.bill_date DESC`,
      [restaurantId, new Date(startDate), new Date(endDate)]
    );
    
    res.json({
      success: true,
      bills: result.rows
    });
  } catch (error) {
    console.error("Error getting bills by date range:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get bills by date range",
      error: error.message
    });
  }
});

// Get daily sales summary
router.get('/summary/daily/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }
    
    const result = await pool.query(
      `SELECT 
        DATE(bill_date) as date,
        COUNT(*) as bill_count,
        SUM(total_amount) as total_sales,
        payment_method,
        COUNT(*) FILTER (WHERE payment_method = 'Cash') as cash_count,
        COUNT(*) FILTER (WHERE payment_method = 'Card') as card_count,
        COUNT(*) FILTER (WHERE payment_method = 'UPI') as upi_count,
        COUNT(*) FILTER (WHERE payment_method = 'Other') as other_count,
        SUM(total_amount) FILTER (WHERE payment_method = 'Cash') as cash_amount,
        SUM(total_amount) FILTER (WHERE payment_method = 'Card') as card_amount,
        SUM(total_amount) FILTER (WHERE payment_method = 'UPI') as upi_amount,
        SUM(total_amount) FILTER (WHERE payment_method = 'Other') as other_amount
      FROM bills_${restaurantId}
      WHERE restaurant_id = $1
      AND bill_date BETWEEN $2 AND $3
      GROUP BY DATE(bill_date), payment_method
      ORDER BY DATE(bill_date)`,
      [restaurantId, new Date(startDate), new Date(endDate)]
    );
    
    res.json({
      success: true,
      summary: result.rows
    });
  } catch (error) {
    console.error("Error getting daily sales summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get daily sales summary",
      error: error.message
    });
  }
});

// Get popular items report
router.get('/report/popular-items/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required"
      });
    }
    
    const limitValue = limit ? parseInt(limit) : 10;
    
    const result = await pool.query(
      `SELECT 
        bi.item_id,
        bi.item_name,
        SUM(bi.quantity) as total_quantity,
        SUM(bi.subtotal) as total_sales
      FROM bill_items_${restaurantId} bi
      JOIN bills_${restaurantId} b ON bi.bill_id = b.id
      WHERE b.restaurant_id = $1
      AND b.bill_date BETWEEN $2 AND $3
      GROUP BY bi.item_id, bi.item_name
      ORDER BY total_quantity DESC
      LIMIT $4`,
      [restaurantId, new Date(startDate), new Date(endDate), limitValue]
    );
    
    res.json({
      success: true,
      popular_items: result.rows
    });
  } catch (error) {
    console.error("Error getting popular items report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get popular items report",
      error: error.message
    });
  }
});

module.exports = router;