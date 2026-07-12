const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { z } = require('zod');

// Input Validation Schema using Zod
const expenseSchema = z.object({
  vehicle_id: z.number().int().positive("Invalid vehicle selection"),
  type: z.enum(['Fuel', 'Toll', 'Other'], { errorMap: () => ({ message: "Type must be Fuel, Toll, or Other" }) }),
  amount: z.number().positive("Amount must be greater than 0"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  description: z.string().optional()
});

// GET /api/expenses - List all expenses
router.get('/', async (req, res, next) => {
  try {
    const expenses = await query.all(`
      SELECT e.*, v.registration_number as vehicle_reg, v.model as vehicle_model
      FROM expenses e
      JOIN vehicles v ON e.vehicle_id = v.id
      ORDER BY e.id DESC
    `);
    res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
});

// POST /api/expenses - Record a manual expense (Fuel, Toll, Other)
router.post('/', async (req, res, next) => {
  try {
    // 1. Validate request body
    const validatedData = expenseSchema.parse(req.body);

    // 2. Validate vehicle exists
    const vehicle = await query.get('SELECT id FROM vehicles WHERE id = ?', [validatedData.vehicle_id]);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found.' });
    }

    // 3. Insert expense
    const result = await query.run(
      `INSERT INTO expenses (vehicle_id, type, amount, date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        validatedData.vehicle_id,
        validatedData.type,
        validatedData.amount,
        validatedData.date,
        validatedData.description || null
      ]
    );

    const newExpense = await query.get('SELECT * FROM expenses WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, data: newExpense });
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
