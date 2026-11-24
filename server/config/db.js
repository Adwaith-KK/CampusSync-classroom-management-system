const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'campussync',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  timezone: '+00:00', // Standardized UTC
  dateStrings: true // Return date/time as strings to prevent automatic timezone conversion discrepancies
});

// Test connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`[CampusSync Database] Connected successfully to MySQL (${process.env.DB_NAME} on port ${process.env.DB_PORT || 3307})`);
    connection.release();
  } catch (error) {
    console.error('[CampusSync Database] Connection failed:', error.message);
  }
})();

module.exports = pool;
