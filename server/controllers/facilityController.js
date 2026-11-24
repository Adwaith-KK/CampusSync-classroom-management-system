const pool = require('../config/db');
const { logAudit } = require('../services/auditService');

async function getAllFacilities(req, res, next) {
  try {
    const { type, status } = req.query;

    let sql = `
      SELECT f.*, 
        (SELECT COUNT(*) FROM facility_bookings fb 
         WHERE fb.facility_id = f.id AND fb.booking_date >= CURRENT_DATE() AND fb.status = 'approved') as upcoming_bookings_count
      FROM facilities f
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      sql += ' AND f.type = ?';
      params.push(type);
    }
    if (status) {
      sql += ' AND f.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY f.name ASC';

    const [facilities] = await pool.query(sql, params);

    res.json({
      success: true,
      count: facilities.length,
      data: facilities
    });
  } catch (error) {
    next(error);
  }
}

async function getFacilityById(req, res, next) {
  try {
    const { id } = req.params;

    const [facilities] = await pool.query('SELECT * FROM facilities WHERE id = ?', [id]);
    if (facilities.length === 0) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }

    const facility = facilities[0];

    // Upcoming approved bookings
    const [upcoming] = await pool.query(
      `SELECT fb.id, fb.purpose, fb.booking_date, fb.start_time, fb.end_time, fb.participants, u.name as booked_by
       FROM facility_bookings fb
       JOIN users u ON fb.user_id = u.id
       WHERE fb.facility_id = ? AND fb.status = 'approved' AND fb.booking_date >= CURRENT_DATE()
       ORDER BY fb.booking_date ASC, fb.start_time ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...facility,
        upcomingBookings: upcoming
      }
    });
  } catch (error) {
    next(error);
  }
}

async function createFacility(req, res, next) {
  try {
    const { name, type, location, capacity, status = 'available', description = '' } = req.body;

    if (!name || !type || !location || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Facility name, type, location, and capacity are required.'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO facilities (name, type, location, capacity, status, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [name.trim(), type, location.trim(), parseInt(capacity, 10), status, description.trim()]
    );

    const newId = result.insertId;

    await logAudit({
      userId: req.user.id,
      action: 'FACILITY_CREATED',
      entityType: 'facilities',
      entityId: newId,
      description: `Coordinator ${req.user.name} registered facility "${name}".`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Facility created successfully.',
      data: { id: newId, name, type, location, capacity, status, description }
    });
  } catch (error) {
    next(error);
  }
}

async function updateFacility(req, res, next) {
  try {
    const { id } = req.params;
    const { name, type, location, capacity, status, description } = req.body;

    const [facilities] = await pool.query('SELECT * FROM facilities WHERE id = ?', [id]);
    if (facilities.length === 0) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }

    const current = facilities[0];

    const updatedName = name ? name.trim() : current.name;
    const updatedType = type || current.type;
    const updatedLocation = location ? location.trim() : current.location;
    const updatedCapacity = capacity !== undefined ? parseInt(capacity, 10) : current.capacity;
    const updatedStatus = status || current.status;
    const updatedDescription = description !== undefined ? description.trim() : current.description;

    await pool.query(
      `UPDATE facilities
       SET name = ?, type = ?, location = ?, capacity = ?, status = ?, description = ?, updated_at = NOW()
       WHERE id = ?`,
      [updatedName, updatedType, updatedLocation, updatedCapacity, updatedStatus, updatedDescription, id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'FACILITY_UPDATED',
      entityType: 'facilities',
      entityId: id,
      description: `Coordinator ${req.user.name} updated facility "${updatedName}" (status: ${updatedStatus}).`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Facility updated successfully.',
      data: { id: parseInt(id, 10), name: updatedName, type: updatedType, location: updatedLocation, capacity: updatedCapacity, status: updatedStatus, description: updatedDescription }
    });
  } catch (error) {
    next(error);
  }
}

async function deleteFacility(req, res, next) {
  try {
    const { id } = req.params;

    const [facilities] = await pool.query('SELECT * FROM facilities WHERE id = ?', [id]);
    if (facilities.length === 0) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }

    const facility = facilities[0];

    // Check for future approved bookings
    const [futureBookings] = await pool.query(
      `SELECT id FROM facility_bookings WHERE facility_id = ? AND booking_date >= CURRENT_DATE() AND status = 'approved'`,
      [id]
    );

    if (futureBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete facility with active future approved bookings. Deactivate facility instead.'
      });
    }

    await pool.query('DELETE FROM facilities WHERE id = ?', [id]);

    await logAudit({
      userId: req.user.id,
      action: 'FACILITY_DELETED',
      entityType: 'facilities',
      entityId: id,
      description: `Coordinator ${req.user.name} deleted facility "${facility.name}".`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Facility "${facility.name}" deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility
};
