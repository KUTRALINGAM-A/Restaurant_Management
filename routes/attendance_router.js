const express = require('express');
const router = express.Router();
const pool = require('../db'); // Database connection
// Temporary auth middleware (replace with real auth later)
const auth = (req, res, next) => next(); // Assuming you have an auth middleware

// Create a new employee
router.post('/employees/:restaurantId', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { restaurantId } = req.params;
    const { name, email, phone, role } = req.body;
    
    // Validate role
    if (!['owner', 'manager', 'staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Role must be owner, manager, or staff"
      });
    }
    
    // Check if email already exists
    const checkResult = await client.query(
      `SELECT id FROM employees_${restaurantId} WHERE email = $1`,
      [email]
    );
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }
    
    // Insert new employee
    const result = await client.query(
      `INSERT INTO employees_${restaurantId}
       (name, email, phone, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, phone, role, created_at`,
      [name, email, phone, role]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      employee: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error creating employee:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create employee",
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get all employees for a restaurant - MODIFIED to match UI expectations
router.get('/employees_:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const result = await pool.query(
      `SELECT id, name, email, phone, role, created_at FROM employees_${restaurantId}
       ORDER BY name ASC`
    );
    
    // Return direct array response as expected by the UI
    res.json(result.rows);
  } catch (error) {
    console.error("Error getting employees:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get employees",
      error: error.message
    });
  }
});

// Alternative route for getting all employees (keeping both for compatibility)
router.get('/employees/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const result = await pool.query(
      `SELECT id, name, email, phone, role, created_at FROM employees_${restaurantId}
       ORDER BY name ASC`
    );
    
    res.json({
      success: true,
      employees: result.rows
    });
  } catch (error) {
    console.error("Error getting employees:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get employees",
      error: error.message
    });
  }
});

// Get a specific employee
router.get('/employees/:restaurantId/:employeeId', auth, async (req, res) => {
  try {
    const { restaurantId, employeeId } = req.params;
    
    const result = await pool.query(
      `SELECT id, name, email, phone, role, created_at FROM employees_${restaurantId}
       WHERE id = $1`,
      [employeeId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    
    res.json({
      success: true,
      employee: result.rows[0]
    });
  } catch (error) {
    console.error("Error getting employee:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get employee",
      error: error.message
    });
  }
});

// Update an employee
router.put('/employees/:restaurantId/:employeeId', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { restaurantId, employeeId } = req.params;
    const { name, email, phone, role } = req.body;
    
    // Validate role
    if (role && !['owner', 'manager', 'staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Role must be owner, manager, or staff"
      });
    }
    
    // Check if email already exists and belongs to a different employee
    if (email) {
      const checkResult = await client.query(
        `SELECT id FROM employees_${restaurantId} WHERE email = $1 AND id != $2`,
        [email, employeeId]
      );
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
    }
    
    // Update employee
    let updateQuery = `UPDATE employees_${restaurantId} SET `;
    const updateValues = [];
    let paramCount = 1;
    
    if (name) {
      updateQuery += `name = $${paramCount}, `;
      updateValues.push(name);
      paramCount++;
    }
    
    if (email) {
      updateQuery += `email = $${paramCount}, `;
      updateValues.push(email);
      paramCount++;
    }
    
    if (phone) {
      updateQuery += `phone = $${paramCount}, `;
      updateValues.push(phone);
      paramCount++;
    }
    
    if (role) {
      updateQuery += `role = $${paramCount}, `;
      updateValues.push(role);
      paramCount++;
    }
    
    // Remove trailing comma and space
    updateQuery = updateQuery.substring(0, updateQuery.length - 2);
    
    // Add WHERE clause
    updateQuery += ` WHERE id = $${paramCount} RETURNING id, name, email, phone, role, created_at`;
    updateValues.push(employeeId);
    
    const result = await client.query(updateQuery, updateValues);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: "Employee updated successfully",
      employee: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error updating employee:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update employee",
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Delete an employee
router.delete('/employees/:restaurantId/:employeeId', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { restaurantId, employeeId } = req.params;
    
    // Check if employee exists
    const checkResult = await client.query(
      `SELECT id, role FROM employees_${restaurantId} WHERE id = $1`,
      [employeeId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }
    
    // Prevent deletion of the last owner
    if (checkResult.rows[0].role === 'owner') {
      const ownerCount = await client.query(
        `SELECT COUNT(*) FROM employees_${restaurantId} WHERE role = 'owner'`
      );
      
      if (parseInt(ownerCount.rows[0].count) <= 1) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete the last owner of the restaurant"
        });
      }
    }
    
    // Delete employee
    await client.query(
      `DELETE FROM employees_${restaurantId} WHERE id = $1`,
      [employeeId]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error deleting employee:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete employee",
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get count of employees by role
router.get('/employees/count/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE role = 'owner') as owners,
        COUNT(*) FILTER (WHERE role = 'manager') as managers,
        COUNT(*) FILTER (WHERE role = 'staff') as staff
      FROM employees_${restaurantId}`
    );
    
    res.json({
      success: true,
      counts: result.rows[0]
    });
  } catch (error) {
    console.error("Error getting employee counts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get employee counts",
      error: error.message
    });
  }
});

// Search employees
router.get('/employees/search/:restaurantId', auth, async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }
    
    const result = await pool.query(
      `SELECT id, name, email, phone, role, created_at 
       FROM employees_${restaurantId}
       WHERE 
         name ILIKE $1 OR 
         email ILIKE $1 OR 
         phone ILIKE $1
       ORDER BY name ASC`,
      [`%${query}%`]
    );
    
    res.json({
      success: true,
      employees: result.rows
    });
  } catch (error) {
    console.error("Error searching employees:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search employees",
      error: error.message
    });
  }
});

// ADDED: New endpoint to support the attendance marking functionality
router.post('/attendance/mark', auth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { attendanceData } = req.body;
    
    if (!attendanceData || !Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance data"
      });
    }
    
    // Assuming you have an attendance table structure like:
    // attendance_[restaurantId](id, employee_id, date, status, remarks, created_at)
    
    // Use a single restaurantId for all entries (should be the same)
    const restaurantId = attendanceData[0].restaurantId;
    
    // Check if the table exists, create if it doesn't
    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_${restaurantId} (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL,
        employee_name VARCHAR NOT NULL,
        employee_role VARCHAR NOT NULL,
        date DATE NOT NULL,
        status VARCHAR CHECK (status IN ('present', 'absent', 'leave', 'halfday')) NOT NULL,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Clear existing attendance records for this date if any
    await client.query(
      `DELETE FROM attendance_${restaurantId} WHERE date = $1`,
      [attendanceData[0].date]
    );
    
    // Insert new attendance records
    for (const record of attendanceData) {
      await client.query(
        `INSERT INTO attendance_${restaurantId}
         (employee_id, employee_name, employee_role, date, status, remarks)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          record.employeeId,
          record.employeeName,
          record.employeeRole,
          record.date,
          record.status,
          record.remarks
        ]
      );
    }
    
    await client.query('COMMIT');
    
    res.status(200).json({
      success: true,
      message: "Attendance marked successfully"
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error marking attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ADDED: Get attendance for a specific date
router.get('/attendance/:restaurantId/:date', auth, async (req, res) => {
  try {
    const { restaurantId, date } = req.params;
    
    // Check if the attendance table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      )`,
      [`attendance_${restaurantId}`]
    );
    
    if (!tableCheck.rows[0].exists) {
      return res.json({
        success: true,
        attendance: []
      });
    }
    
    const result = await pool.query(
      `SELECT * FROM attendance_${restaurantId}
       WHERE date = $1
       ORDER BY employee_name ASC`,
      [date]
    );
    
    res.json({
      success: true,
      attendance: result.rows
    });
  } catch (error) {
    console.error("Error getting attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get attendance",
      error: error.message
    });
  }
});

module.exports = router;