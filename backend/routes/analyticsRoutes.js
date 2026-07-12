const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET KPIs for dashboard
router.get('/kpis', async (req, res, next) => {
  try {
    const totalVehicles = await query.get('SELECT COUNT(*) as count FROM vehicles WHERE status != ?', ['Retired']);
    const availableVehicles = await query.get('SELECT COUNT(*) as count FROM vehicles WHERE status = ?', ['Available']);
    const onTripVehicles = await query.get('SELECT COUNT(*) as count FROM vehicles WHERE status = ?', ['On Trip']);
    const inShopVehicles = await query.get('SELECT COUNT(*) as count FROM vehicles WHERE status = ?', ['In Shop']);

    const totalDrivers = await query.get('SELECT COUNT(*) as count FROM drivers WHERE status != ?', ['Suspended']);
    const availableDrivers = await query.get('SELECT COUNT(*) as count FROM drivers WHERE status = ?', ['Available']);
    const onTripDrivers = await query.get('SELECT COUNT(*) as count FROM drivers WHERE status = ?', ['On Trip']);

    const activeTrips = await query.get('SELECT COUNT(*) as count FROM trips WHERE status = ?', ['Dispatched']);
    const completedTrips = await query.get('SELECT COUNT(*) as count FROM trips WHERE status = ?', ['Completed']);
    const totalTrips = await query.get('SELECT COUNT(*) as count FROM trips');

    const activeMaintenance = await query.get('SELECT COUNT(*) as count FROM maintenance_logs WHERE status = ?', ['Active']);

    res.json({
      success: true,
      data: {
        vehicles: {
          total: totalVehicles.count,
          available: availableVehicles.count,
          on_trip: onTripVehicles.count,
          in_shop: inShopVehicles.count
        },
        drivers: {
          total: totalDrivers.count,
          available: availableDrivers.count,
          on_trip: onTripDrivers.count
        },
        trips: {
          active: activeTrips.count,
          completed: completedTrips.count,
          total: totalTrips.count
        },
        maintenance: {
          active: activeMaintenance.count
        }
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET reports/analytics
router.get('/reports', async (req, res, next) => {
  try {
    // Fuel efficiency by vehicle
    const fuelEfficiency = await query.all(`
      SELECT
        v.registration_number,
        v.model,
        SUM(t.planned_distance) as total_distance,
        SUM(t.fuel_consumed) as total_fuel,
        CASE
          WHEN SUM(t.fuel_consumed) > 0
          THEN ROUND(SUM(t.planned_distance) / SUM(t.fuel_consumed), 2)
          ELSE 0
        END as km_per_liter
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      WHERE t.status = 'Completed' AND t.fuel_consumed IS NOT NULL
      GROUP BY v.id
      ORDER BY km_per_liter DESC
    `);

    // Fleet utilization (% of vehicles currently on trip)
    const utilization = await query.get(`
      SELECT
        ROUND(
          (SELECT COUNT(*) FROM vehicles WHERE status = 'On Trip') * 100.0 /
          NULLIF((SELECT COUNT(*) FROM vehicles WHERE status != 'Retired'), 0),
          1
        ) as utilization_percent
    `);

    // Vehicle ROI calculation
    const vehicleROI = await query.all(`
      SELECT
        v.id,
        v.registration_number,
        v.acquisition_cost,
        COALESCE(SUM(e.amount), 0) as total_expenses,
        (SELECT COUNT(*) FROM trips WHERE vehicle_id = v.id AND status = 'Completed') as completed_trips,
        CASE
          WHEN v.acquisition_cost > 0
          THEN ROUND(
            ((SELECT COUNT(*) FROM trips WHERE vehicle_id = v.id AND status = 'Completed') * 5000.0 - COALESCE(SUM(e.amount), 0))
            / v.acquisition_cost * 100, 2
          )
          ELSE 0
        END as roi_percent
      FROM vehicles v
      LEFT JOIN expenses e ON v.id = e.vehicle_id
      GROUP BY v.id
      ORDER BY roi_percent DESC
    `);

    // Monthly trip counts
    const monthlyTrips = await query.all(`
      SELECT
        strftime('%Y-%m', t.id) as month,
        COUNT(*) as trip_count
      FROM trips t
      WHERE t.status = 'Completed'
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      data: {
        fuel_efficiency: fuelEfficiency,
        fleet_utilization: utilization.utilization_percent || 0,
        vehicle_roi: vehicleROI,
        monthly_trips: monthlyTrips
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
