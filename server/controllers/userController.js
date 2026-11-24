const pool = require('../config/db');
const { logAudit } = require('../services/auditService');

async function getAllUsers(req, res, next) {
  try {
    const { role, status, search } = req.query;

    let sql = `
      SELECT id, name, email, role, department, phone, status, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY role ASC, name ASC';

    const [users] = await pool.query(sql, params);

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    const [users] = await pool.query(
      `SELECT id, name, email, role, department, phone, status, created_at, updated_at
       FROM users WHERE id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    next(error);
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be either 'active' or 'inactive'." });
    }

    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }

    const [users] = await pool.query('SELECT name, role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await pool.query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, id]);

    await logAudit({
      userId: req.user.id,
      action: status === 'active' ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'users',
      entityId: id,
      description: `Coordinator ${req.user.name} changed status of ${users[0].name} (${users[0].role}) to ${status}.`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `User ${users[0].name} has been set to ${status}.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUserStatus
};
