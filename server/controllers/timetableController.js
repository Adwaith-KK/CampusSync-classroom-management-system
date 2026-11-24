const pool = require('../config/db');
const { checkTimetableConflict } = require('../services/conflictService');
const { logAudit } = require('../services/auditService');

async function getTimetable(req, res, next) {
  try {
    const { day, classroomId, facultyId, semester } = req.query;

    let sql = `
      SELECT 
        t.id, t.course_name, t.course_code, t.day_of_week, 
        t.start_time, t.end_time, t.semester, t.section,
        c.id as classroom_id, c.room_number, c.building, c.floor, c.type as room_type,
        u.id as faculty_id, u.name as faculty_name, u.email as faculty_email, u.department as faculty_dept
      FROM timetable t
      JOIN classrooms c ON t.classroom_id = c.id
      JOIN users u ON t.faculty_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (day) {
      sql += ' AND t.day_of_week = ?';
      params.push(day);
    }
    if (classroomId) {
      sql += ' AND t.classroom_id = ?';
      params.push(classroomId);
    }
    if (facultyId) {
      sql += ' AND t.faculty_id = ?';
      params.push(facultyId);
    }
    if (semester) {
      sql += ' AND t.semester = ?';
      params.push(semester);
    }

    sql += ` ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), t.start_time ASC`;

    const [rows] = await pool.query(sql, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
}

async function createTimetableEntry(req, res, next) {
  try {
    const { classroomId, facultyId, courseName, courseCode, dayOfWeek, startTime, endTime, semester = 'MCA Semester 3', section = 'A' } = req.body;

    if (!classroomId || !facultyId || !courseName || !courseCode || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'All timetable fields (classroom, faculty, course name, code, day, start and end time) are required.'
      });
    }

    // Validate times (startTime must be before endTime)
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be strictly before end time.'
      });
    }

    // Verify classroom exists
    const [rooms] = await pool.query('SELECT room_number FROM classrooms WHERE id = ?', [classroomId]);
    if (rooms.length === 0) {
      return res.status(404).json({ success: false, message: 'Specified classroom does not exist.' });
    }

    // Verify faculty exists
    const [faculties] = await pool.query("SELECT name FROM users WHERE id = ? AND role = 'faculty'", [facultyId]);
    if (faculties.length === 0) {
      return res.status(404).json({ success: false, message: 'Selected faculty member was not found or is not active faculty.' });
    }

    // Check for timetable conflicts (Room overlap OR Faculty double booking)
    const conflict = await checkTimetableConflict({
      classroomId,
      facultyId,
      dayOfWeek,
      startTime,
      endTime
    });

    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        conflictType: conflict.type,
        message: conflict.message
      });
    }

    const [result] = await pool.query(
      `INSERT INTO timetable (classroom_id, faculty_id, course_name, course_code, day_of_week, start_time, end_time, semester, section, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [classroomId, facultyId, courseName.trim(), courseCode.trim().toUpperCase(), dayOfWeek, startTime, endTime, semester.trim(), section.trim()]
    );

    const newId = result.insertId;

    await logAudit({
      userId: req.user.id,
      action: 'TIMETABLE_ENTRY_CREATED',
      entityType: 'timetable',
      entityId: newId,
      description: `Coordinator ${req.user.name} added timetable slot for ${courseName} (${dayOfWeek} ${startTime}-${endTime}) in ${rooms[0].room_number}.`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Timetable entry created successfully without conflicts.',
      data: { id: newId, classroomId, facultyId, courseName, courseCode, dayOfWeek, startTime, endTime, semester, section }
    });
  } catch (error) {
    next(error);
  }
}

async function updateTimetableEntry(req, res, next) {
  try {
    const { id } = req.params;
    const { classroomId, facultyId, courseName, courseCode, dayOfWeek, startTime, endTime, semester, section } = req.body;

    const [existing] = await pool.query('SELECT * FROM timetable WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found.' });
    }

    const current = existing[0];
    const targetRoomId = classroomId || current.classroom_id;
    const targetFacultyId = facultyId || current.faculty_id;
    const targetDay = dayOfWeek || current.day_of_week;
    const targetStart = startTime || current.start_time;
    const targetEnd = endTime || current.end_time;
    const targetCourse = courseName || current.course_name;
    const targetCode = courseCode || current.course_code;
    const targetSem = semester || current.semester;
    const targetSection = section || current.section;

    if (targetStart >= targetEnd) {
      return res.status(400).json({ success: false, message: 'Start time must be before end time.' });
    }

    // Check conflict excluding current entry
    const conflict = await checkTimetableConflict({
      classroomId: targetRoomId,
      facultyId: targetFacultyId,
      dayOfWeek: targetDay,
      startTime: targetStart,
      endTime: targetEnd,
      excludeId: id
    });

    if (conflict.hasConflict) {
      return res.status(409).json({
        success: false,
        conflictType: conflict.type,
        message: conflict.message
      });
    }

    await pool.query(
      `UPDATE timetable 
       SET classroom_id = ?, faculty_id = ?, course_name = ?, course_code = ?, day_of_week = ?, start_time = ?, end_time = ?, semester = ?, section = ?, updated_at = NOW()
       WHERE id = ?`,
      [targetRoomId, targetFacultyId, targetCourse.trim(), targetCode.trim().toUpperCase(), targetDay, targetStart, targetEnd, targetSem.trim(), targetSection.trim(), id]
    );

    await logAudit({
      userId: req.user.id,
      action: 'TIMETABLE_ENTRY_UPDATED',
      entityType: 'timetable',
      entityId: id,
      description: `Coordinator ${req.user.name} updated timetable entry ${id} (${targetCourse}).`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Timetable entry updated successfully.',
      data: { id: parseInt(id, 10), classroomId: targetRoomId, facultyId: targetFacultyId, courseName: targetCourse, courseCode: targetCode, dayOfWeek: targetDay, startTime: targetStart, endTime: targetEnd, semester: targetSem, section: targetSection }
    });
  } catch (error) {
    next(error);
  }
}

async function deleteTimetableEntry(req, res, next) {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM timetable WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Timetable entry not found.' });
    }

    const current = existing[0];
    await pool.query('DELETE FROM timetable WHERE id = ?', [id]);

    await logAudit({
      userId: req.user.id,
      action: 'TIMETABLE_ENTRY_DELETED',
      entityType: 'timetable',
      entityId: id,
      description: `Coordinator ${req.user.name} deleted timetable slot for ${current.course_name} (${current.day_of_week}).`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Timetable entry deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry
};
