const pool = require('../config/db');

async function getAuditLogs(req, res, next) {
  try {
    const { action, entityType, limit = 20, page, offset } = req.query;
    const computedOffset = page ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : parseInt(offset || 0, 10);

    let sql = `
      SELECT 
        a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.description, a.ip_address, a.created_at,
        u.name as user_name, u.email as user_email, u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (action) {
      sql += ' AND a.action = ?';
      params.push(action);
    }
    if (entityType) {
      sql += ' AND a.entity_type = ?';
      params.push(entityType);
    }

    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10), computedOffset);

    const [logs] = await pool.query(sql, params);

    const [totalRows] = await pool.query('SELECT COUNT(*) as count FROM audit_logs');

    res.json({
      success: true,
      total: totalRows[0].count,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAuditLogs
};
