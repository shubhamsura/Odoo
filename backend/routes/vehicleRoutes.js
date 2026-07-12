const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET all vehicles
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM vehicles';
    const params = [];

    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }

    sql += ' ORDER BY id DESC';
    const vehicles = await query.all(sql, params);
    res.json({ success: true, data: vehicles });
  } catch (err) {
    next(err);
  }
});

// GET single vehicle
router.get('/:id', async (req, res, next) => {
  try {
    const vehicle = await query.get('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }
    res.json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
});

// POST create vehicle
router.post('/', async (req, res, next) => {
  try {
    const { registration_number, model, type, max_load, odometer = 0, acquisition_cost } = req.body;

    if (!registration_number || !model || !type || !max_load || acquisition_cost === undefined) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (!['Truck', 'Van', 'Car'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Type must be Truck, Van, or Car' });
    }

    if (max_load <= 0) {
      return res.status(400).json({ success: false, error: 'Max load must be greater than 0' });
    }

    const existing = await query.get('SELECT id FROM vehicles WHERE registration_number = ?', [registration_number]);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Vehicle with this registration number already exists' });
    }

    const result = await query.run(
      'INSERT INTO vehicles (registration_number, model, type, max_load, odometer, acquisition_cost) VALUES (?, ?, ?, ?, ?, ?)',
      [registration_number, model, type, max_load, odometer, acquisition_cost]
    );

    res.status(201).json({ success: true, data: { id: result.id, message: 'Vehicle created successfully' } });
  } catch (err) {
    next(err);
  }
});

// PUT update vehicle
router.put('/:id', async (req, res, next) => {
  try {
    const { status, odometer } = req.body;
    const updates = [];
    const params = [];

    if (status) {
      if (!['Available', 'On Trip', 'In Shop', 'Retired'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (odometer !== undefined) {
      updates.push('odometer = ?');
      params.push(odometer);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    params.push(req.params.id);
    await query.run(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ success: true, message: 'Vehicle updated successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
