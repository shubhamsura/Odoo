const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { z } = require('zod');

// Input Validation Schema using Zod
const vehicleSchema = z.object({
  registration_number: z.string().min(1, "Registration number is required").toUpperCase(),
  model: z.string().min(1, "Model is required"),
  type: z.enum(['Truck', 'Van', 'Car'], { errorMap: () => ({ message: "Type must be Truck, Van, or Car" }) }),
  max_load: z.number().positive("Maximum load capacity must be greater than 0"),
  odometer: z.number().nonnegative("Odometer reading cannot be negative").default(0),
  acquisition_cost: z.number().nonnegative("Acquisition cost cannot be negative"),
  status: z.enum(['Available', 'On Trip', 'In Shop', 'Retired']).default('Available')
});

// GET /api/vehicles - List vehicles with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { type, status } = req.query;
    let sql = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY id DESC';
    const vehicles = await query.all(sql, params);
    res.json({ success: true, data: vehicles });
  } catch (error) {
    next(error);
  }
});

// POST /api/vehicles - Register new vehicle
router.post('/', async (req, res, next) => {
  try {
    // 1. Validate request body
    const validatedData = vehicleSchema.parse(req.body);

    // 2. Check for duplicate registration number
    const duplicate = await query.get(
      'SELECT id FROM vehicles WHERE registration_number = ?',
      [validatedData.registration_number]
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: `A vehicle with registration number '${validatedData.registration_number}' is already registered.`
      });
    }

    // 3. Insert vehicle
    const result = await query.run(
      `INSERT INTO vehicles (registration_number, model, type, max_load, odometer, acquisition_cost, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        validatedData.registration_number,
        validatedData.model,
        validatedData.type,
        validatedData.max_load,
        validatedData.odometer,
        validatedData.acquisition_cost,
        validatedData.status
      ]
    );

    const newVehicle = await query.get('SELECT * FROM vehicles WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, data: newVehicle });
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
