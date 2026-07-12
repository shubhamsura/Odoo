const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET all trips
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT t.*, v.registration_number as vehicle_reg, d.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
    `;
    const params = [];

    if (status) {
      sql += ' WHERE t.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY t.id DESC';
    const trips = await query.all(sql, params);
    res.json({ success: true, data: trips });
  } catch (err) {
    next(err);
  }
});

// GET single trip
router.get('/:id', async (req, res, next) => {
  try {
    const trip = await query.get(`
      SELECT t.*, v.registration_number as vehicle_reg, d.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }
    res.json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
});

// POST create/dispatch trip
router.post('/', async (req, res, next) => {
  try {
    const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status = 'Dispatched' } = req.body;

    if (!source || !destination || !vehicle_id || !driver_id || !cargo_weight || !planned_distance) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Validate vehicle exists and is available
    const vehicle = await query.get('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) {
      return res.status(400).json({ success: false, error: 'Vehicle not found' });
    }
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ success: false, error: `Vehicle is not available. Current status: ${vehicle.status}` });
    }

    // Validate cargo weight against vehicle capacity
    if (cargo_weight > vehicle.max_load) {
      return res.status(400).json({
        success: false,
        error: `Cargo weight (${cargo_weight} kg) exceeds vehicle capacity (${vehicle.max_load} kg). Dispatch blocked.`
      });
    }

    // Validate driver exists and is available
    const driver = await query.get('SELECT * FROM drivers WHERE id = ?', [driver_id]);
    if (!driver) {
      return res.status(400).json({ success: false, error: 'Driver not found' });
    }
    if (driver.status !== 'Available') {
      return res.status(400).json({ success: false, error: `Driver is not available. Current status: ${driver.status}` });
    }

    // Check driver license expiry
    const today = new Date().toISOString().split('T')[0];
    if (driver.license_expiry_date < today) {
      return res.status(400).json({ success: false, error: `Cannot dispatch: Driver's license expired on ${driver.license_expiry_date}` });
    }

    // Create trip and update vehicle/driver status in transaction
    const tripResult = await query.run(
      'INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status]
    );

    if (status === 'Dispatched') {
      await query.run('UPDATE vehicles SET status = ? WHERE id = ?', ['On Trip', vehicle_id]);
      await query.run('UPDATE drivers SET status = ? WHERE id = ?', ['On Trip', driver_id]);
    }

    res.status(201).json({
      success: true,
      data: { id: tripResult.id, message: 'Trip created and dispatched successfully' }
    });
  } catch (err) {
    next(err);
  }
});

// PUT complete trip
router.put('/:id/complete', async (req, res, next) => {
  try {
    const { end_odometer, fuel_consumed } = req.body;

    if (!end_odometer || !fuel_consumed) {
      return res.status(400).json({ success: false, error: 'End odometer and fuel consumed are required' });
    }

    const trip = await query.get('SELECT * FROM trips WHERE id = ?', [req.params.id]);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }
    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ success: false, error: 'Only dispatched trips can be completed' });
    }

    // Update trip
    await query.run(
      'UPDATE trips SET status = ?, end_odometer = ?, fuel_consumed = ? WHERE id = ?',
      ['Completed', end_odometer, fuel_consumed, req.params.id]
    );

    // Update vehicle odometer and status
    await query.run('UPDATE vehicles SET odometer = ?, status = ? WHERE id = ?', [end_odometer, 'Available', trip.vehicle_id]);

    // Update driver status
    await query.run('UPDATE drivers SET status = ? WHERE id = ?', ['Available', trip.driver_id]);

    res.json({ success: true, message: 'Trip completed successfully' });
  } catch (err) {
    next(err);
  }
});

// PUT cancel trip
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const trip = await query.get('SELECT * FROM trips WHERE id = ?', [req.params.id]);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found' });
    }
    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      return res.status(400).json({ success: false, error: 'Trip cannot be cancelled' });
    }

    await query.run('UPDATE trips SET status = ? WHERE id = ?', ['Cancelled', req.params.id]);

    if (trip.status === 'Dispatched') {
      await query.run('UPDATE vehicles SET status = ? WHERE id = ?', ['Available', trip.vehicle_id]);
      await query.run('UPDATE drivers SET status = ? WHERE id = ?', ['Available', trip.driver_id]);
    }

    res.json({ success: true, message: 'Trip cancelled successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
