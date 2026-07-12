const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { z } = require('zod');

// Input Validation Schemas
const openMaintenanceSchema = z.object({
  vehicle_id: z.number().int().positive("Invalid vehicle selection"),
  description: z.string().min(1, "Reason/Description for maintenance is required")
});

const closeMaintenanceSchema = z.object({
  cost: z.number().nonnegative("Maintenance cost cannot be negative")
});

// GET /api/maintenance - Fetch all maintenance logs
router.get('/', async (req, res, next) => {
  try {
    const logs = await query.all(`
      SELECT m.*, v.registration_number as vehicle_reg, v.model as vehicle_model
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      ORDER BY m.id DESC
    `);
    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
});

// POST /api/maintenance - Put a vehicle in maintenance (Sets status to In Shop)
router.post('/', async (req, res, next) => {
  try {
    const validatedData = openMaintenanceSchema.parse(req.body);
    const { vehicle_id, description } = validatedData;

    // 1. Fetch and validate vehicle status
    const vehicle = await query.get('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found.' });
    }
    if (vehicle.status !== 'Available') {
      return res.status(400).json({
        success: false,
        error: `Vehicle ${vehicle.registration_number} is currently ${vehicle.status} and cannot be checked into maintenance.`
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Perform updates inside transaction
    const queries = [
      {
        sql: 'UPDATE vehicles SET status = "In Shop" WHERE id = ?',
        params: [vehicle_id]
      },
      {
        sql: `INSERT INTO maintenance_logs (vehicle_id, description, cost, start_date, status)
              VALUES (?, ?, 0.0, ?, 'Active')`,
        params: [vehicle_id, description, todayStr]
      }
    ];

    const results = await query.transaction(queries);
    const newLogId = results[1].id;
    const newLog = await query.get('SELECT * FROM maintenance_logs WHERE id = ?', [newLogId]);

    res.status(201).json({ success: true, data: newLog });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    next(error);
  }
});

// PUT /api/maintenance/:id/close - Close maintenance (releases vehicle to Available)
router.put('/:id/close', async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = closeMaintenanceSchema.parse(req.body);
    const { cost } = validatedData;

    // 1. Fetch and validate maintenance log status
    const log = await query.get('SELECT * FROM maintenance_logs WHERE id = ?', [id]);
    if (!log) {
      return res.status(404).json({ success: false, error: 'Maintenance log not found.' });
    }
    if (log.status !== 'Active') {
      return res.status(400).json({ success: false, error: 'This maintenance log is already closed.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Perform transaction: close maintenance log, release vehicle, log expense
    const queries = [
      {
        sql: 'UPDATE maintenance_logs SET status = "Closed", cost = ?, end_date = ? WHERE id = ?',
        params: [cost, todayStr, id]
      },
      {
        sql: 'UPDATE vehicles SET status = "Available" WHERE id = (SELECT vehicle_id FROM maintenance_logs WHERE id = ?)',
        params: [id]
      },
      {
        sql: `INSERT INTO expenses (vehicle_id, type, amount, date, description)
              VALUES (?, 'Other', ?, ?, ?)`,
        params: [
          log.vehicle_id,
          cost,
          todayStr,
          `Maintenance cost logged from resolved ticket #${id} (${log.description})`
        ]
      }
    ];

    await query.transaction(queries);
    const updatedLog = await query.get('SELECT * FROM maintenance_logs WHERE id = ?', [id]);

    res.json({ success: true, data: updatedLog });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors.map(e => e.message).join(', ')
      });
    }
    next(error);
  }
});

module.exports = router;
