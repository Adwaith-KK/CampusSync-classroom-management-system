const pool = require('../config/db');
const { logAudit } = require('../services/auditService');

async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user.id;

    const [notifications] = await pool.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );

    const [unread] = await pool.query(
      `SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    res.json({
      success: true,
      unreadCount: unread[0].unread_count,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    res.json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;

    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
      [userId]
    );

    res.json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
}

async function broadcastAnnouncement(req, res, next) {
  try {
    const { title, message, targetRole } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required for campus announcements.'
      });
    }

    let userQuery = `SELECT id FROM users WHERE status = 'active'`;
    const params = [];
    if (targetRole) {
      userQuery += ` AND role = ?`;
      params.push(targetRole);
    }

    const [recipients] = await pool.query(userQuery, params);

    for (const r of recipients) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
         VALUES (?, ?, ?, 'system', 0, NOW())`,
        [r.id, title.trim(), message.trim()]
      );
    }

    await logAudit({
      userId: req.user.id,
      action: 'SYSTEM_ANNOUNCEMENT_BROADCAST',
      entityType: 'notifications',
      entityId: null,
      description: `${req.user.name} broadcast announcement: "${title}" to ${targetRole || 'all campus users'}.`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: `Announcement broadcast to ${recipients.length} campus users.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  broadcastAnnouncement
};
