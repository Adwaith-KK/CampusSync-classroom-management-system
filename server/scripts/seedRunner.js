const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runSeed() {
  console.log('[CampusSync Seed] Initializing database seeding...');
  
  // Connection without database to ensure database can be recreated if needed
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    multipleStatements: true
  });

  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const seedPath = path.join(__dirname, '../../database/seed.sql');

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('[CampusSync Seed] Applying database schema...');
    await connection.query(schemaSql);
    console.log('[CampusSync Seed] Schema applied successfully.');

    console.log('[CampusSync Seed] Inserting seed demo data...');
    await connection.query(seedSql);
    console.log('[CampusSync Seed] Demo data seeded successfully.');

    console.log('[CampusSync Seed] Database initialization complete!');
  } catch (err) {
    console.error('[CampusSync Seed] Seeding error:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runSeed();
