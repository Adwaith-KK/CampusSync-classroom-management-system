const pool = require('../config/db');

/**
 * Send notification to a specific user
 * @param {Object} params
 * @param {number} params.userId
 * @param {string} params.title
 * @param {string} params.message
 * @param {'claim'|'booking'|'system'|'timetable'} [params.type='system']
 */
async function sendNotification({ userId, title, message, type = 'system' }) {
  try {
    const sql = `
      INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, NOW())
    `;
    const [result] = await pool.query(sql, [userId, title, message, type]);
    return result.insertId;
  } catch (error) {
    console.error('[NotificationService Error]: Failed to create notification:', error.message);
  }
}

/**
 * Send notification to all users of specific roles (e.g. all coordinators or all hods)
 * @param {Object} params
 * @param {string[]} params.roles - ['hod', 'coordinator']
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.type='system']
 */
async function notifyRoles({ roles, title, message, type = 'system' }) {
  try {
    const [users] = await pool.query(
      `SELECT id FROM users WHERE role IN (?) AND status = 'active'`,
      [roles]
    );
    for (const u of users) {
      await sendNotification({ userId: u.id, title, message, type });
    }
  } catch (error) {
    console.error('[NotificationService Error]: Failed to broadcast to roles:', error.message);
  }
}

module.exports = {
  sendNotification,
  notifyRoles
};
