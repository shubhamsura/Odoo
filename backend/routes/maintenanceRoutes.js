const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET all maintenance logs
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT m.*, v.registration_number as vehicle_reg
      FROM maintenance_logs m
      LEFT JOIN vehicles v ON m.vehicle_id = v.id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE m.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY m.id DESC';
    const logs = await query.all(sql, params);
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

// POST check-in vehicle for maintenance
router.post('/', async (req, res, next) => {
  try {
    const { vehicle_id, description, cost = 0 } = req.body;

    if (!vehicle_id || !description) {
      return res.status(400).json({ success: false, error: 'Vehicle ID and description are required' });
    }

    const vehicle = await query.get('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' });
    }
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ success: false, error: `Vehicle must be Available to check-in. Current status: ${vehicle.status}` });
    }

    const today = new Date().toISOString().split('T')[0];

    const result = await query.run(
      'INSERT INTO maintenance_logs (vehicle_id, description, cost, start_date) VALUES (?, ?, ?, ?)',
      [vehicle_id, description, cost, today]
    );

    await query.run('UPDATE vehicles SET status = ? WHERE id = ?', ['In Shop', vehicle_id]);

    res.status(201).json({ success: true, data: { id: result.id, message: 'Vehicle checked in for maintenance' } });
  } catch (err) {
    next(err);
  }
});

// PUT close maintenance and release vehicle
router.put('/:id/close', async (req, res, next) => {
  try {
    const { cost } = req.body;

    const log = await query.get('SELECT * FROM maintenance_logs WHERE id = ?', [req.params.id]);
    if (!log) {
      return res.status(404).json({ success: false, error: 'Maintenance log not found' });
    }
    if (log.status === 'Closed') {
      return res.status(400).json({ success: false, error: 'Maintenance already closed' });
    }

    const today = new Date().toISOString().split('T')[0];
    const updates = ['status = ?', 'end_date = ?'];
    const params = ['Closed', today];

    if (cost !== undefined) {
      updates.push('cost = ?');
      params.push(cost);
    }

    params.push(req.params.id);
    await query.run(`UPDATE maintenance_logs SET ${updates.join(', ')} WHERE id = ?`, params);

    await query.run('UPDATE vehicles SET status = ? WHERE id = ?', ['Available', log.vehicle_id]);

    res.json({ success: true, message: 'Maintenance closed and vehicle released' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
