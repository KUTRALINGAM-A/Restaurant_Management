const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  
  if (!bearerHeader) {
    return res.status(403).json({ error: 'No token provided' });
  }
  
  const bearer = bearerHeader.split(' ');
  const token = bearer[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Fetch menu items for a specific restaurant
router.get('/menu/items/:restaurantId', verifyToken, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const menuItemsQuery = `
      SELECT id, item_name, category 
      FROM "menu_${restaurantId}"
      ORDER BY item_name
    `;
    
    const result = await pool.query(menuItemsQuery);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Detailed Error in Menu Items Lookup:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Lookup bill details by bill number and date
router.get('/bills/details/:restaurantId/:billNumber', verifyToken, async (req, res) => {
  try {
    const { restaurantId, billNumber } = req.params;
    const { date } = req.query;
    
    console.log(`Detailed Lookup Params:
      - Restaurant ID: ${restaurantId}
      - Bill Number: ${billNumber}
      - Date: ${date}
    `);
    
    // Enhanced query with comprehensive bill and item details
    const billDetailsQuery = `
      SELECT 
        b.id as bill_id,
        b.bill_number,
        b.bill_date::text,
        b.employee_name,
        b.customer_name,
        b.customer_phone,
        b.payment_method,
        b.total_amount,
        json_agg(
          json_build_object(
            'item_id', bi.item_id,
            'item_name', bi.item_name,
            'quantity', bi.quantity,
            'price', bi.price,
            'subtotal', bi.subtotal
          )
        ) as items
      FROM "bills_${restaurantId}" b
      JOIN "bill_items_${restaurantId}" bi ON b.id = bi.bill_id
      WHERE 
        b.bill_number = $1 AND 
        DATE(b.bill_date) = $2
      GROUP BY 
        b.id, b.bill_number, b.bill_date, 
        b.employee_name, b.customer_name, 
        b.customer_phone, b.payment_method, 
        b.total_amount
    `;
    
    const result = await pool.query(billDetailsQuery, [billNumber, date]);
    
    if (result.rows.length === 0) {
      // Provide more diagnostic information
      const diagnosticQuery = `
        SELECT 
          COUNT(*) as bill_count,
          array_agg(DISTINCT bill_number) as existing_bill_numbers,
          array_agg(DISTINCT bill_date::date) as existing_dates
        FROM "bills_${restaurantId}"
      `;
      
      const diagnosticResult = await pool.query(diagnosticQuery);
      
      return res.status(404).json({ 
        message: 'Bill not found',
        diagnostics: {
          totalBills: diagnosticResult.rows[0].bill_count,
          existingBillNumbers: diagnosticResult.rows[0].existing_bill_numbers,
          existingDates: diagnosticResult.rows[0].existing_dates
        }
      });
    }
    
    // Transform the result to match frontend expectation
    const billDetails = result.rows[0];
    const responseData = {
      bill_number: billDetails.bill_number,
      bill_date: billDetails.bill_date,
      employee_name: billDetails.employee_name,
      customer_name: billDetails.customer_name,
      customer_phone: billDetails.customer_phone,
      payment_method: billDetails.payment_method,
      total_amount: billDetails.total_amount,
      items: billDetails.items
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Detailed Error in Bill Lookup:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Lookup bills by specific item and date
router.get('/bills/item-lookup/:restaurantId', verifyToken, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { item, date } = req.query;
    
    console.log(`Item lookup: Restaurant ID ${restaurantId}, Item ${item}, Date ${date}`);
    
    // Query to fetch comprehensive bill details containing a specific item
    const itemBillsQuery = `
      SELECT 
        b.bill_number,
        b.bill_date::text,
        b.employee_name,
        b.customer_name,
        bi.item_name,
        bi.quantity,
        bi.price,
        bi.subtotal,
        b.total_amount,
        b.payment_method
      FROM "bills_${restaurantId}" b
      JOIN "bill_items_${restaurantId}" bi ON b.id = bi.bill_id
      WHERE 
        bi.item_name = $1 AND 
        DATE(b.bill_date) = $2
      ORDER BY b.bill_date DESC
    `;
    
    const result = await pool.query(itemBillsQuery, [item, date]);
    
    if (result.rows.length === 0) {
      console.log(`No bills found for Restaurant ID ${restaurantId}, Item ${item}, Date ${date}`);
      return res.status(404).json({ message: 'No bills found for this item on the specified date' });
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error looking up bills by item:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

module.exports = router;