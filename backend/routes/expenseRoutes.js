const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET all expenses
router.get('/', async (req, res, next) => {
  try {
    const { vehicle_id, type } = req.query;
    let sql = `
      SELECT e.*, v.registration_number as vehicle_reg
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.id
      WHERE 1=1
    `;
    const params = [];

    if (vehicle_id) {
      sql += ' AND e.vehicle_id = ?';
      params.push(vehicle_id);
    }

    if (type) {
      sql += ' AND e.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY e.date DESC, e.id DESC';
    const expenses = await query.all(sql, params);
    res.json({ success: true, data: expenses });
  } catch (err) {
    next(err);
  }
});

// GET expense summary
router.get('/summary', async (req, res, next) => {
  try {
    const summary = await query.all(`
      SELECT
        type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM expenses
      GROUP BY type
    `);

    const total = await query.get('SELECT SUM(amount) as total FROM expenses');

    res.json({
      success: true,
      data: {
        by_type: summary,
        total: total.total || 0
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST create expense
router.post('/', async (req, res, next) => {
  try {
    const { vehicle_id, type, amount, date, description } = req.body;

    if (!vehicle_id || !type || !amount || !date) {
      return res.status(400).json({ success: false, error: 'Vehicle ID, type, amount, and date are required' });
    }

    if (!['Fuel', 'Toll', 'Other'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Type must be Fuel, Toll, or Other' });
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be greater than 0' });
    }

    const vehicle = await query.get('SELECT id FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }

    const result = await query.run(
      'INSERT INTO expenses (vehicle_id, type, amount, date, description) VALUES (?, ?, ?, ?, ?)',
      [vehicle_id, type, amount, date, description || null]
    );

    res.status(201).json({ success: true, data: { id: result.id, message: 'Expense logged successfully' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
