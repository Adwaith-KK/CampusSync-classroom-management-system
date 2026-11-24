const pool = require('../config/db');

/**
 * Log an audit record in the database
 * @param {Object} params
 * @param {number|null} params.userId
 * @param {string} params.action - e.g. CLASSROOM_CLAIMED, BOOKING_APPROVED, USER_LOGIN
 * @param {string} params.entityType - e.g. classrooms, facility_bookings, users
 * @param {number|null} params.entityId
 * @param {string} params.description
 * @param {string|null} [params.ipAddress]
 */
async function logAudit({ userId = null, action, entityType, entityId = null, description, ipAddress = null }) {
  try {
    const sql = `
      INSERT INTO audit_logs (user_id, action, entity_type, entity_id, description, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;
    await pool.query(sql, [userId, action, entityType, entityId, description, ipAddress]);
  } catch (error) {
    // Non-blocking: audit failure should not crash main transaction, but log to server console
    console.error('[AuditService Error]: Failed to write audit log:', error.message);
  }
}

module.exports = {
  logAudit
};
