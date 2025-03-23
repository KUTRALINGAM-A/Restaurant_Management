const express = require('express');
const router = express.Router();
const pool = require('../db'); // Assuming you have a database connection setup
const jwt = require('jsonwebtoken');
const multer = require('multer');
const upload = multer(); // For handling file uploads

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

// Fetch restaurant logo
router.get('/restaurant-logo/:restaurantId', verifyToken, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const logoQuery = `
      SELECT logo 
      FROM restaurants 
      WHERE id = $1
    `;
    
    const result = await pool.query(logoQuery, [restaurantId]);
    
    if (result.rows.length === 0 || !result.rows[0].logo) {
      return res.status(404).send('Logo not found');
    }
    
    // Assuming logo is stored as bytea in PostgreSQL
    const logo = result.rows[0].logo;
    
    // Set appropriate content type
    res.setHeader('Content-Type', 'image/png');
    res.send(logo);
  } catch (error) {
    console.error('Error fetching restaurant logo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch item quantities - KEEP ORIGINAL ROUTE NAME
router.get('/bill_itemss/:restaurantId', verifyToken, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    const itemQuantitiesQuery = `
      SELECT bi.item_id, bi.item_name, SUM(bi.quantity) as quantity
      FROM "bill_items_${restaurantId}" bi
      JOIN "bills_${restaurantId}" b ON bi.bill_id = b.id
      WHERE b.bill_date BETWEEN $1 AND $2
      GROUP BY bi.item_id, bi.item_name
      ORDER BY quantity DESC
    `;
    
    const result = await pool.query(itemQuantitiesQuery, [startDate, endDate]);
    
    res.json({ items: result.rows });
  } catch (error) {
    console.error('Error fetching item quantities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch item revenues
router.get('/reports/item-revenues/:restaurantId', verifyToken, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    const itemRevenuesQuery = `
      SELECT bi.item_id, bi.item_name as name, SUM(bi.subtotal) as revenue
      FROM "bill_items_${restaurantId}" bi
      JOIN "bills_${restaurantId}" b ON bi.bill_id = b.id
      WHERE b.bill_date BETWEEN $1 AND $2
      GROUP BY bi.item_id, bi.item_name
      ORDER BY revenue DESC
    `;
    
    const result = await pool.query(itemRevenuesQuery, [startDate, endDate]);
    
    res.json({ items: result.rows });
  } catch (error) {
    console.error('Error fetching item revenues:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch category revenues
router.get('/reports/category-revenues/:restaurantId', verifyToken, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    const categoryRevenuesQuery = `
      SELECT m.category as name, SUM(bi.subtotal) as value
      FROM "bill_items_${restaurantId}" bi
      JOIN "bills_${restaurantId}" b ON bi.bill_id = b.id
      JOIN "menu_${restaurantId}" m ON bi.item_id = m.id
      WHERE b.bill_date BETWEEN $1 AND $2
      GROUP BY m.category
      ORDER BY value DESC
    `;
    
    const result = await pool.query(categoryRevenuesQuery, [startDate, endDate]);
    
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Error fetching category revenues:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch popular items - KEEP ORIGINAL STRUCTURE
router.get('/reports/popular-items/:restaurantId', verifyToken, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate, limit } = req.query;
    
    // First get total quantity of all items
    const totalQuantityQuery = `
      SELECT SUM(bi.quantity) as total
      FROM "bill_items_${restaurantId}" bi
      JOIN "bills_${restaurantId}" b ON bi.bill_id = b.id
      WHERE b.bill_date BETWEEN $1 AND $2
    `;
    
    const totalResult = await pool.query(totalQuantityQuery, [startDate, endDate]);
    const totalQuantity = parseInt(totalResult.rows[0].total) || 1; // Avoid division by zero
    
    // Get popular items with percentage and revenue
    const popularItemsQuery = `
      SELECT 
        bi.item_name as name, 
        SUM(bi.quantity) as quantity,
        (SUM(bi.quantity) * 100.0 / $3) as percentage,
        SUM(bi.subtotal) as value
      FROM "bill_items_${restaurantId}" bi
      JOIN "bills_${restaurantId}" b ON bi.bill_id = b.id
      WHERE b.bill_date BETWEEN $1 AND $2
      GROUP BY bi.item_name
      ORDER BY quantity DESC
      LIMIT $4
    `;
    
    const result = await pool.query(popularItemsQuery, [
      startDate,
      endDate,
      totalQuantity,
      limit || 5
    ]);
    
    // Format the percentage
    const formattedItems = result.rows.map(item => ({
      ...item,
      percentage: parseFloat(item.percentage).toFixed(1)
    }));
    
    res.json({ items: formattedItems });
  } catch (error) {
    console.error('Error fetching popular items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch summary metrics
router.get('/reports/summary/:restaurantId', verifyToken, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Total revenue
    const revenueQuery = `
      SELECT SUM(total_amount) as total_revenue
      FROM "bills_${restaurantId}"
      WHERE bill_date BETWEEN $1 AND $2
    `;
    
    // Total items sold
    const itemsSoldQuery = `
      SELECT SUM(quantity) as total_items_sold
      FROM "bill_items_${restaurantId}" bi
      JOIN "bills_${restaurantId}" b ON bi.bill_id = b.id
      WHERE b.bill_date BETWEEN $1 AND $2
    `;
    
    // Customer count (count of unique bill IDs)
    const customerCountQuery = `
      SELECT COUNT(DISTINCT id) as customer_count
      FROM "bills_${restaurantId}"
      WHERE bill_date BETWEEN $1 AND $2
    `;
    
    // Average order value
    const avgOrderQuery = `
      SELECT AVG(total_amount) as avg_order_value
      FROM "bills_${restaurantId}"
      WHERE bill_date BETWEEN $1 AND $2
    `;
    
    const [revenueResult, itemsResult, customerResult, avgOrderResult] = await Promise.all([
      pool.query(revenueQuery, [startDate, endDate]),
      pool.query(itemsSoldQuery, [startDate, endDate]),
      pool.query(customerCountQuery, [startDate, endDate]),
      pool.query(avgOrderQuery, [startDate, endDate])
    ]);
    
    res.json({
      totalRevenue: parseFloat(revenueResult.rows[0].total_revenue || 0),
      totalItemsSold: parseInt(itemsResult.rows[0].total_items_sold || 0),
      customerCount: parseInt(customerResult.rows[0].customer_count || 0),
      averageOrderValue: parseFloat(avgOrderResult.rows[0].avg_order_value || 0)
    });
  } catch (error) {
    console.error('Error fetching summary metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch sales trend data
router.get('/reports/sales-trend/:restaurantId', verifyToken, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { startDate, endDate, interval } = req.query;
    
    let timeFormat;
    switch(interval) {
      case 'hour':
        timeFormat = 'YYYY-MM-DD HH24:00';
        break;
      case 'day':
        timeFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        timeFormat = 'YYYY-"W"IW'; // ISO week format
        break;
      case 'month':
        timeFormat = 'YYYY-MM';
        break;
      default:
        timeFormat = 'YYYY-MM-DD';
    }
    
    const trendQuery = `
      SELECT 
        TO_CHAR(bill_date, $3) as period,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
      FROM "bills_${restaurantId}"
      WHERE bill_date BETWEEN $1 AND $2
      GROUP BY period
      ORDER BY MIN(bill_date)
    `;
    
    const result = await pool.query(trendQuery, [startDate, endDate, timeFormat]);
    
    res.json({ trend: result.rows });
  } catch (error) {
    console.error('Error fetching sales trend:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch comparative data (current vs previous period)
router.get('/reports/compare/:restaurantId', verifyToken, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { 
      currentStartDate, 
      currentEndDate, 
      previousStartDate, 
      previousEndDate,
      interval
    } = req.query;
    
    let timeFormat;
    switch(interval) {
      case 'day':
        timeFormat = 'Day DD';
        break;
      case 'week':
        timeFormat = '"Week" IW';
        break;
      default:
        timeFormat = 'Mon DD';
    }
    
    // Current period data
    const currentQuery = `
      SELECT 
        TO_CHAR(bill_date, $3) as period,
        SUM(total_amount) as revenue
      FROM "bills_${restaurantId}"
      WHERE bill_date BETWEEN $1 AND $2
      GROUP BY period
      ORDER BY MIN(bill_date)
    `;
    
    // Previous period data
    const previousQuery = `
      SELECT 
        TO_CHAR(bill_date, $3) as period,
        SUM(total_amount) as revenue
      FROM "bills_${restaurantId}"
      WHERE bill_date BETWEEN $1 AND $2
      GROUP BY period
      ORDER BY MIN(bill_date)
    `;
    
    const [currentResult, previousResult] = await Promise.all([
      pool.query(currentQuery, [currentStartDate, currentEndDate, timeFormat]),
      pool.query(previousQuery, [previousStartDate, previousEndDate, timeFormat])
    ]);
    
    // Combine the data for comparison
    const periodsSet = new Set();
    currentResult.rows.forEach(row => periodsSet.add(row.period));
    previousResult.rows.forEach(row => periodsSet.add(row.period));
    
    const periods = Array.from(periodsSet).sort();
    
    const currentMap = currentResult.rows.reduce((map, row) => {
      map[row.period] = parseFloat(row.revenue);
      return map;
    }, {});
    
    const previousMap = previousResult.rows.reduce((map, row) => {
      map[row.period] = parseFloat(row.revenue);
      return map;
    }, {});
    
    const comparison = periods.map(period => ({
      period,
      current: currentMap[period] || 0,
      previous: previousMap[period] || 0
    }));
    
    res.json({ comparison });
  } catch (error) {
    console.error('Error fetching comparative data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;