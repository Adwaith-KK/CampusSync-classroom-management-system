const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { logAudit } = require('../services/auditService');

async function register(req, res, next) {
  try {
    const { name, email, password, role = 'student', department = 'Computer Applications', phone = '' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    const validRoles = ['student', 'faculty', 'hod', 'coordinator'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role selected. Allowed: ${validRoles.join(', ')}`
      });
    }

    // Check email uniqueness
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, phone, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [name.trim(), email.toLowerCase().trim(), passwordHash, role, department.trim(), phone.trim()]
    );

    const newUserId = result.insertId;

    await logAudit({
      userId: newUserId,
      action: 'USER_REGISTERED',
      entityType: 'users',
      entityId: newUserId,
      description: `New user ${name} registered with role '${role}'.`,
      ipAddress: req.ip
    });

    const token = jwt.sign(
      { id: newUserId, email: email.toLowerCase().trim(), role, name: name.trim() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUserId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        department: department.trim(),
        phone: phone.trim(),
        status: 'active'
      }
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or credentials.'
      });
    }

    const user = users[0];

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the campus administrator.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'users',
      entityId: user.id,
      description: `User ${user.name} (${user.role}) logged in successfully.`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'USER_LOGOUT',
        entityType: 'users',
        entityId: req.user.id,
        description: `User ${req.user.name} logged out.`,
        ipAddress: req.ip
      });
    }
    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, phone, department, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = users[0];

    let updatedHash = user.password_hash;
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.'
        });
      }
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Current password provided is incorrect.'
        });
      }
      const salt = await bcrypt.genSalt(10);
      updatedHash = await bcrypt.hash(newPassword, salt);
    }

    const updatedName = name ? name.trim() : user.name;
    const updatedPhone = phone !== undefined ? phone.trim() : user.phone;
    const updatedDept = department ? department.trim() : user.department;

    await pool.query(
      `UPDATE users SET name = ?, phone = ?, department = ?, password_hash = ?, updated_at = NOW() WHERE id = ?`,
      [updatedName, updatedPhone, updatedDept, updatedHash, userId]
    );

    await logAudit({
      userId,
      action: 'USER_PROFILE_UPDATED',
      entityType: 'users',
      entityId: userId,
      description: `User ${updatedName} updated profile information.`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: userId,
        name: updatedName,
        email: user.email,
        role: user.role,
        department: updatedDept,
        phone: updatedPhone,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile
};
