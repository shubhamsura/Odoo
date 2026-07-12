const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../transitops.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database at:', dbPath);
    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;', (err) => {
      if (err) console.error('Error enabling foreign keys:', err.message);
    });
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // 1. Create VEHICLES Table
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        registration_number TEXT UNIQUE NOT NULL,
        model TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('Truck', 'Van', 'Car')),
        max_load REAL NOT NULL CHECK (max_load > 0),
        odometer INTEGER NOT NULL DEFAULT 0 CHECK (odometer >= 0),
        acquisition_cost REAL NOT NULL CHECK (acquisition_cost >= 0),
        status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired'))
      )
    `);

    // 2. Create DRIVERS Table
    db.run(`
      CREATE TABLE IF NOT EXISTS drivers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        license_number TEXT UNIQUE NOT NULL,
        license_category TEXT NOT NULL,
        license_expiry_date TEXT NOT NULL, -- Stored as ISO DATE (YYYY-MM-DD)
        contact_number TEXT NOT NULL,
        safety_score REAL NOT NULL DEFAULT 100.0 CHECK (safety_score BETWEEN 0.0 AND 100.0),
        status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'Off Duty', 'Suspended'))
      )
    `);

    // 3. Create TRIPS Table
    db.run(`
      CREATE TABLE IF NOT EXISTS trips (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        destination TEXT NOT NULL,
        vehicle_id INTEGER NOT NULL,
        driver_id INTEGER NOT NULL,
        cargo_weight REAL NOT NULL CHECK (cargo_weight > 0),
        planned_distance REAL NOT NULL CHECK (planned_distance > 0),
        status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
        fuel_consumed REAL, -- Set when Completed
        end_odometer INTEGER, -- Set when Completed
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE RESTRICT,
        FOREIGN KEY (driver_id) REFERENCES drivers (id) ON DELETE RESTRICT
      )
    `);

    // 4. Create MAINTENANCE_LOGS Table
    db.run(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        cost REAL NOT NULL DEFAULT 0.0 CHECK (cost >= 0.0),
        start_date TEXT NOT NULL, -- YYYY-MM-DD
        end_date TEXT, -- YYYY-MM-DD
        status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
      )
    `);

    // 5. Create EXPENSES Table
    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('Fuel', 'Toll', 'Other')),
        amount REAL NOT NULL CHECK (amount > 0.0),
        date TEXT NOT NULL, -- YYYY-MM-DD
        description TEXT,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
      )
    `);

    // Seed mock data if database is empty
    seedMockData();
  });
}

function seedMockData() {
  db.get('SELECT COUNT(*) as count FROM vehicles', (err, row) => {
    if (err) {
      console.error('Error checking vehicles table:', err.message);
      return;
    }
    if (row.count === 0) {
      console.log('Seeding initial mock data...');

      // Seed Vehicles
      db.run("INSERT INTO vehicles (registration_number, model, type, max_load, odometer, acquisition_cost, status) VALUES ('MH-12-PQ-1234', 'Tata Prima 4925', 'Truck', 10000.0, 12500, 3500000.0, 'Available')");
      db.run("INSERT INTO vehicles (registration_number, model, type, max_load, odometer, acquisition_cost, status) VALUES ('DL-01-AB-5678', 'Mahindra Bolero Pik-Up', 'Van', 1500.0, 48200, 850000.0, 'Available')");
      db.run("INSERT INTO vehicles (registration_number, model, type, max_load, odometer, acquisition_cost, status) VALUES ('KA-03-XY-9012', 'Maruti Suzuki Eeco', 'Car', 700.0, 23100, 550000.0, 'Available')");

      // Seed Drivers
      db.run("INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES ('Alex Kumar', 'DL-123456789012', 'Heavy Cargo', '2027-10-15', '9876543210', 94.5, 'Available')");
      db.run("INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES ('Rahul Singh', 'DL-987654321098', 'Light Vehicle', '2026-11-20', '8765432109', 88.0, 'Available')");
      // Suspended driver
      db.run("INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES ('Amit Sharma', 'DL-111122223333', 'Heavy Cargo', '2026-08-30', '7654321098', 65.5, 'Suspended')");
      // Expired license driver
      db.run("INSERT INTO drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status) VALUES ('Vikram Rao', 'DL-555544443333', 'Light Vehicle', '2025-05-10', '6543210987', 95.0, 'Available')");

      console.log('Mock data seeded successfully.');
    }
  });
}

// Helper query runner functions wrapped in Promises for async/await readability
const query = {
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  transaction(queries) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const promises = queries.map(q => {
          return new Promise((res, rej) => {
            db.run(q.sql, q.params, function(err) {
              if (err) rej(err);
              else res({ id: this.lastID, changes: this.changes });
            });
          });
        });
        Promise.all(promises)
          .then(results => {
            db.run('COMMIT', (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
              } else {
                resolve(results);
              }
            });
          })
          .catch(err => {
            db.run('ROLLBACK');
            reject(err);
          });
      });
    });
  }
};

module.exports = { db, query };
