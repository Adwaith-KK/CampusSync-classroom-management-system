const pool = require('../config/db');
const { getClassroomsWithAvailability } = require('../services/availabilityService');
const { logAudit } = require('../services/auditService');

async function getAllClassrooms(req, res, next) {
  try {
    const { building, floor, minCapacity, type, status } = req.query;

    let classrooms = await getClassroomsWithAvailability();

    // In-memory filters based on computed availability status and attributes
    if (building) {
      classrooms = classrooms.filter(c => c.building.toLowerCase().includes(building.toLowerCase()));
    }
    if (floor !== undefined && floor !== '') {
      classrooms = classrooms.filter(c => c.floor === parseInt(floor, 10));
    }
    if (minCapacity) {
      classrooms = classrooms.filter(c => c.capacity >= parseInt(minCapacity, 10));
    }
    if (type) {
      classrooms = classrooms.filter(c => c.type === type);
    }
    if (status) {
      classrooms = classrooms.filter(c => c.status === status);
    }

    res.json({
      success: true,
      count: classrooms.length,
      data: classrooms
    });
  } catch (error) {
    next(error);
  }
}

async function getClassroomById(req, res, next) {
  try {
    const { id } = req.params;
    const classrooms = await getClassroomsWithAvailability(id);

    if (classrooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found.'
      });
    }

    const classroom = classrooms[0];

    // Fetch full weekly timetable for this room
    const [timetableEntries] = await pool.query(
      `SELECT t.id, t.course_name, t.course_code, t.day_of_week, t.start_time, t.end_time, t.semester, t.section, u.name as faculty_name
       FROM timetable t
       JOIN users u ON t.faculty_id = u.id
       WHERE t.classroom_id = ?
       ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), t.start_time ASC`,
      [id]
    );

    // Fetch recent claim history
    const [claimHistory] = await pool.query(
      `SELECT cc.id, cc.start_time, cc.end_time, cc.duration_minutes, cc.purpose, cc.status, cc.released_at, u.name as claimed_by
       FROM classroom_claims cc
       JOIN users u ON cc.user_id = u.id
       WHERE cc.classroom_id = ?
       ORDER BY cc.created_at DESC
       LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...classroom,
        timetable: timetableEntries,
        recentClaims: claimHistory
      }
    });
  } catch (error) {
    next(error);
  }
}

async function createClassroom(req, res, next) {
  try {
    const { roomNumber, building, floor, capacity, type = 'Lecture Room', status = 'available', features = '' } = req.body;

    if (!roomNumber || !building || floor === undefined || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Room number, building, floor, and capacity are required.'
      });
    }

    // Check unique room_number
    const [existing] = await pool.query('SELECT id FROM classrooms WHERE room_number = ?', [roomNumber.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Classroom "${roomNumber}" already exists.`
      });
    }

    const [result] = await pool.query(
      `INSERT INTO classrooms (room_number, building, floor, capacity, type, status, features, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [roomNumber.trim(), building.trim(), parseInt(floor, 10), parseInt(capacity, 10), type, status, features.trim()]
    );

    const newId = result.insertId;

    await logAudit({
      userId: req.user.id,
      action: 'CLASSROOM_CREATED',
      entityType: 'classrooms',
      entityId: newId,
      description: `Coordinator ${req.user.name} created classroom ${roomNumber} in ${building}.`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Classroom created successfully.',
      data: { id: newId, roomNumber, building, floor, capacity, type, status, features }
    });
  } catch (error) {
    next(error);
  }
}

async function updateClassroom(req, res, next) {
  try {
    const { id } = req.params;
    const { roomNumber, building, floor, capacity, type, status, features } = req.body;

    const [classrooms] = await pool.query('SELECT * FROM classrooms WHERE id = ?', [id]);
    if (classrooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found.'
      });
    }

    const current = classrooms[0];

    // If roomNumber is changing, ensure uniqueness
    if (roomNumber && roomNumber.trim() !== current.room_number) {
      const [dups] = await pool.query('SELECT id FROM classrooms WHERE room_number = ? AND id != ?', [roomNumber.trim(), id]);
      if (dups.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Room number "${roomNumber}" is already in use.`
        });
      }
    }

    const updatedRoomNumber = roomNumber ? roomNumber.trim() : current.room_number;
    const updatedBuilding = building ? building.trim() : current.building;
    const updatedFloor = floor !== undefined ? parseInt(floor, 10) : current.floor;
    const updatedCapacity = capacity !== undefined ? parseInt(capacity, 10) : current.capacity;
    const updatedType = type || current.type;
    const updatedStatus = status || current.status;
    const updatedFeatures = features !== undefined ? features.trim() : current.features;

    await pool.query(
      `UPDATE classrooms 
       SET room_number = ?, building = ?, floor = ?, capacity = ?, type = ?, status = ?, features = ?, updated_at = NOW()
       WHERE id = ?`,
      [updatedRoomNumber, updatedBuilding, updatedFloor, updatedCapacity, updatedType, updatedStatus, updatedFeatures, id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'CLASSROOM_MODIFIED',
      entityType: 'classrooms',
      entityId: id,
      description: `Coordinator ${req.user.name} updated classroom ${updatedRoomNumber} (status: ${updatedStatus}).`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Classroom updated successfully.',
      data: {
        id: parseInt(id, 10),
        roomNumber: updatedRoomNumber,
        building: updatedBuilding,
        floor: updatedFloor,
        capacity: updatedCapacity,
        type: updatedType,
        status: updatedStatus,
        features: updatedFeatures
      }
    });
  } catch (error) {
    next(error);
  }
}

async function deleteClassroom(req, res, next) {
  try {
    const { id } = req.params;

    const [classrooms] = await pool.query('SELECT * FROM classrooms WHERE id = ?', [id]);
    if (classrooms.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Classroom not found.'
      });
    }

    const room = classrooms[0];

    // Check for active claims
    const [activeClaims] = await pool.query(
      `SELECT id FROM classroom_claims WHERE classroom_id = ? AND status = 'active'`,
      [id]
    );
    if (activeClaims.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete classroom while an active temporary claim is ongoing.'
      });
    }

    await pool.query('DELETE FROM classrooms WHERE id = ?', [id]);

    await logAudit({
      userId: req.user.id,
      action: 'CLASSROOM_DELETED',
      entityType: 'classrooms',
      entityId: id,
      description: `Coordinator ${req.user.name} deleted classroom ${room.room_number}.`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Classroom ${room.room_number} deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllClassrooms,
  getClassroomById,
  createClassroom,
  updateClassroom,
  deleteClassroom
};
