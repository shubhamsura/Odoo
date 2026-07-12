const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { z } = require('zod');

// Input Validation Schema using Zod
const driverSchema = z.object({
  name: z.string().min(1, "Driver name is required"),
  license_number: z.string().min(1, "License number is required").toUpperCase(),
  license_category: z.string().min(1, "License category is required"),
  license_expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "License expiry date must be in YYYY-MM-DD format"),
  contact_number: z.string().min(10, "Contact number must be at least 10 digits"),
  safety_score: z.number().min(0).max(100).default(100.0),
  status: z.enum(['Available', 'On Trip', 'Off Duty', 'Suspended']).default('Available')
});

// GET /api/drivers - List drivers with status filter
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM drivers WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY id DESC';
    const drivers = await query.all(sql, params);
    res.json({ success: true, data: drivers });
  } catch (error) {
    next(error);
  }
});

// POST /api/drivers - Register new driver
router.post('/', async (req, res, next) => {
  try {
    // 1. Validate request body
    const validatedData = driverSchema.parse(req.body);

    // 2. Check for duplicate license number
    const duplicate = await query.get(
      'SELECT id FROM drivers WHERE license_number = ?',
      [validatedData.license_number]
    );

    if (duplicate) {
      return res.status(400).json({
        success: false,
        error: `A driver with license number '${validatedData.license_number}' is already registered.`
      });
    }

    // 3. Insert driver
    const result = await query.run(
      `INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        validatedData.name,
        validatedData.license_number,
        validatedData.license_category,
        validatedData.license_expiry_date,
        validatedData.contact_number,
        validatedData.safety_score,
        validatedData.status
      ]
    );

    const newDriver = await query.get('SELECT * FROM drivers WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, data: newDriver });
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
