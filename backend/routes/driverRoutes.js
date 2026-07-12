const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET all drivers
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM drivers';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY id DESC';
    const drivers = await query.all(sql, params);
    res.json({ success: true, data: drivers });
  } catch (err) {
    next(err);
  }
});

// GET single driver
router.get('/:id', async (req, res, next) => {
  try {
    const driver = await query.get('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found' });
    }
    res.json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
});

// POST create driver
router.post('/', async (req, res, next) => {
  try {
    const { name, license_number, license_category, license_expiry_date, contact_number, safety_score = 100 } = req.body;

    if (!name || !license_number || !license_category || !license_expiry_date || !contact_number) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const existing = await query.get('SELECT id FROM drivers WHERE license_number = ?', [license_number]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Driver with this license number already exists' });
    }

    const result = await query.run(
      'INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score) VALUES (?, ?, ?, ?, ?, ?)',
      [name, license_number, license_category, license_expiry_date, contact_number, safety_score]
    );

    res.status(201).json({ success: true, data: { id: result.id, message: 'Driver created successfully' } });
  } catch (err) {
    next(err);
  }
});

// PUT update driver
router.put('/:id', async (req, res, next) => {
  try {
    const { status, safety_score } = req.body;
    const updates = [];
    const params = [];

    if (status) {
      if (!['Available', 'On Trip', 'Off Duty', 'Suspended'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (safety_score !== undefined) {
      if (safety_score < 0 || safety_score > 100) {
        return res.status(400).json({ success: false, error: 'Safety score must be between 0 and 100' });
      }
      updates.push('safety_score = ?');
      params.push(safety_score);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    params.push(req.params.id);
    await query.run(`UPDATE drivers SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Driver updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
