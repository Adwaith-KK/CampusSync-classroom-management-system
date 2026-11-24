const pool = require('../config/db');
const { logAudit } = require('../services/auditService');

async function getSettings(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value, description FROM system_settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json({
      success: true,
      data: settings,
      raw: rows
    });
  } catch (error) {
    next(error);
  }
}

async function updateSetting(req, res, next) {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Key and value are required.' });
    }

    const [existing] = await pool.query('SELECT * FROM system_settings WHERE setting_key = ?', [key]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: `Setting "${key}" not found.` });
    }

    await pool.query('UPDATE system_settings SET setting_value = ? WHERE setting_key = ?', [String(value), key]);

    await logAudit({
      userId: req.user.id,
      action: 'SYSTEM_SETTING_UPDATED',
      entityType: 'system_settings',
      entityId: null,
      description: `Coordinator ${req.user.name} changed setting ${key} to "${value}".`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Setting ${key} updated successfully.`,
      key,
      value
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateSetting
};
