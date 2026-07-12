const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { z } = require('zod');

// Input Validation Schemas
const dispatchSchema = z.object({
  source: z.string().min(1, "Source destination is required"),
  destination: z.string().min(1, "Target destination is required"),
  vehicle_id: z.number().int().positive("Invalid vehicle selection"),
  driver_id: z.number().int().positive("Invalid driver selection"),
  cargo_weight: z.number().positive("Cargo weight must be greater than 0"),
  planned_distance: z.number().positive("Planned distance must be greater than 0")
});

const completionSchema = z.object({
  end_odometer: z.number().int().nonnegative("End odometer must be a non-negative integer"),
  fuel_consumed: z.number().positive("Fuel consumed must be greater than 0")
});

// GET /api/trips - List all trips
router.get('/', async (req, res, next) => {
  try {
    const trips = await query.all(`
      SELECT t.*, v.registration_number as vehicle_reg, v.model as vehicle_model, d.name as driver_name
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.id DESC
    `);
    res.json({ success: true, data: trips });
  } catch (error) {
    next(error);
  }
});

// POST /api/trips - Dispatch a trip (Transactional with strict safety validations)
router.post('/', async (req, res, next) => {
  try {
    const validatedData = dispatchSchema.parse(req.body);
    const { vehicle_id, driver_id, cargo_weight } = validatedData;

    // 1. Retrieve & validate vehicle status and capacity
    const vehicle = await query.get('SELECT * FROM vehicles WHERE id = ?', [vehicle_id]);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found.' });
    }
    if (vehicle.status !== 'Available') {
      return res.status(400).json({
        success: false,
        error: `Vehicle ${vehicle.registration_number} is currently ${vehicle.status} and cannot be dispatched.`
      });
    }
    if (cargo_weight > vehicle.max_load) {
      return res.status(400).json({
        success: false,
        error: `Cargo weight (${cargo_weight} kg) exceeds vehicle's maximum load capacity (${vehicle.max_load} kg).`
      });
    }

    // 2. Retrieve & validate driver status and license expiry
    const driver = await query.get('SELECT * FROM drivers WHERE id = ?', [driver_id]);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found.' });
    }
    if (driver.status !== 'Available') {
      return res.status(400).json({
        success: false,
        error: `Driver ${driver.name} is currently ${driver.status} and cannot be assigned to a trip.`
      });
    }

    // Validate license expiration
    const todayStr = new Date().toISOString().split('T')[0];
    if (driver.license_expiry_date < todayStr) {
      return res.status(400).json({
        success: false,
        error: `Cannot dispatch: Driver ${driver.name}'s driving license expired on ${driver.license_expiry_date}.`
      });
    }

    // 3. Perform atomic updates inside a SQL Transaction
    const queries = [
      {
        sql: 'UPDATE vehicles SET status = "On Trip" WHERE id = ?',
        params: [vehicle_id]
      },
      {
        sql: 'UPDATE drivers SET status = "On Trip" WHERE id = ?',
        params: [driver_id]
      },
      {
        sql: `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, status)
              VALUES (?, ?, ?, ?, ?, ?, 'Dispatched')`,
        params: [
          validatedData.source,
          validatedData.destination,
          vehicle_id,
          driver_id,
          cargo_weight,
          validatedData.planned_distance
        ]
      }
    ];

    const results = await query.transaction(queries);
    const newTripId = results[2].id; // The last ID from INSERT query
    const newTrip = await query.get('SELECT * FROM trips WHERE id = ?', [newTripId]);

    res.status(201).json({ success: true, data: newTrip });
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

// PUT /api/trips/:id/complete - Complete trip with odometer and fuel log inputs
router.put('/:id/complete', async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = completionSchema.parse(req.body);
    const { end_odometer, fuel_consumed } = validatedData;

    // 1. Fetch trip and check status
    const trip = await query.get('SELECT * FROM trips WHERE id = ?', [id]);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found.' });
    }
    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ success: false, error: `Only dispatched trips can be completed. Current status: ${trip.status}` });
    }

    // 2. Fetch associated vehicle and check odometer constraints
    const vehicle = await query.get('SELECT * FROM vehicles WHERE id = ?', [trip.vehicle_id]);
    if (end_odometer < vehicle.odometer) {
      return res.status(400).json({
        success: false,
        error: `Invalid odometer reading: ending odometer (${end_odometer} km) cannot be less than starting odometer (${vehicle.odometer} km).`
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const fuelCostPerLiter = 100.0; // Fixed fuel cost factor for reporting/calculation
    const totalFuelCost = fuel_consumed * fuelCostPerLiter;

    // 3. Atomically update Trip, Vehicle, Driver, and Log Fuel Expense in a SQL Transaction
    const queries = [
      {
        sql: 'UPDATE trips SET status = "Completed", fuel_consumed = ?, end_odometer = ? WHERE id = ?',
        params: [fuel_consumed, end_odometer, id]
      },
      {
        sql: 'UPDATE vehicles SET status = "Available", odometer = ? WHERE id = ?',
        params: [end_odometer, trip.vehicle_id]
      },
      {
        sql: 'UPDATE drivers SET status = "Available" WHERE id = ?',
        params: [trip.driver_id]
      },
      {
        sql: `INSERT INTO expenses (vehicle_id, type, amount, date, description)
              VALUES (?, 'Fuel', ?, ?, ?)`,
        params: [
          trip.vehicle_id,
          totalFuelCost,
          todayStr,
          `Fuel log generated from Trip #${id} (${trip.source} to ${trip.destination})`
        ]
      }
    ];

    await query.transaction(queries);
    const updatedTrip = await query.get('SELECT * FROM trips WHERE id = ?', [id]);

    res.json({ success: true, data: updatedTrip });
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

// PUT /api/trips/:id/cancel - Cancel a dispatched trip
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Fetch trip and check status
    const trip = await query.get('SELECT * FROM trips WHERE id = ?', [id]);
    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip not found.' });
    }
    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ success: false, error: `Only dispatched trips can be cancelled. Current status: ${trip.status}` });
    }

    // 2. Perform updates inside transaction
    const queries = [
      {
        sql: 'UPDATE trips SET status = "Cancelled" WHERE id = ?',
        params: [id]
      },
      {
        sql: 'UPDATE vehicles SET status = "Available" WHERE id = ?',
        params: [trip.vehicle_id]
      },
      {
        sql: 'UPDATE drivers SET status = "Available" WHERE id = ?',
        params: [trip.driver_id]
      }
    ];

    await query.transaction(queries);
    const updatedTrip = await query.get('SELECT * FROM trips WHERE id = ?', [id]);

    res.json({ success: true, data: updatedTrip });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
