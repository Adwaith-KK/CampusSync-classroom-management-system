const pool = require('../config/db');
const { checkClaimConflict } = require('../services/conflictService');
const { logAudit } = require('../services/auditService');
const { sendNotification } = require('../services/notificationService');

async function claimClassroom(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const classroomId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const { purpose = 'Unscheduled Academic Session / Extra Lecture', durationMinutes } = req.body;

    if (!classroomId) {
      return res.status(400).json({ success: false, message: 'Classroom ID is required.' });
    }

    // Begin transaction for concurrency control
    await connection.beginTransaction();

    // 1. Fetch classroom with lock
    const [rooms] = await connection.query(
      'SELECT id, room_number, building, status FROM classrooms WHERE id = ? FOR UPDATE',
      [classroomId]
    );

    if (rooms.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Classroom not found.' });
    }

    const room = rooms[0];

    if (room.status === 'maintenance') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Classroom ${room.room_number} is currently marked for maintenance and cannot be claimed.`
      });
    }

    // 2. Fetch default / max duration from system_settings
    const [settings] = await connection.query(
      `SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('default_claim_duration_minutes', 'max_claim_duration_minutes')`
    );
    const settingsMap = {};
    settings.forEach(s => { settingsMap[s.setting_key] = parseInt(s.setting_value, 10); });

    const defaultDuration = settingsMap.default_claim_duration_minutes || 60;
    const maxDuration = settingsMap.max_claim_duration_minutes || 180;

    let claimDuration = durationMinutes ? parseInt(durationMinutes, 10) : defaultDuration;
    if (claimDuration <= 0 || claimDuration > maxDuration) {
      claimDuration = defaultDuration;
    }

    // Calculate start and end timestamps
    const now = new Date();
    const end = new Date(now.getTime() + claimDuration * 60 * 1000);

    // Format dates to MySQL datetime string: YYYY-MM-DD HH:mm:ss
    const formatSqlDatetime = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const startSql = formatSqlDatetime(now);
    const endSql = formatSqlDatetime(end);

    // 3. Strict conflict checking (existing active claims & current timetable slots)
    const conflictResult = await checkClaimConflict({
      classroomId,
      startDateTime: startSql,
      endDateTime: endSql,
      connection
    });

    if (conflictResult.hasConflict) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: conflictResult.message
      });
    }

    // 4. Insert temporary claim
    const [insertResult] = await connection.query(
      `INSERT INTO classroom_claims (classroom_id, user_id, start_time, end_time, duration_minutes, purpose, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
      [classroomId, userId, startSql, endSql, claimDuration, purpose.trim()]
    );

    const claimId = insertResult.insertId;

    // 5. Update classroom status to 'temporarily_claimed'
    await connection.query(
      `UPDATE classrooms SET status = 'temporarily_claimed', updated_at = NOW() WHERE id = ?`,
      [classroomId]
    );

    await connection.commit();

    // 6. Audit & Notification
    await logAudit({
      userId,
      action: 'CLASSROOM_CLAIMED',
      entityType: 'classroom_claims',
      entityId: claimId,
      description: `${req.user.name} (${req.user.role}) claimed classroom ${room.room_number} for ${claimDuration} mins. Purpose: ${purpose}`,
      ipAddress: req.ip
    });

    await sendNotification({
      userId,
      title: 'Classroom Claim Activated',
      message: `You have successfully claimed ${room.room_number} until ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      type: 'claim'
    });

    res.status(201).json({
      success: true,
      message: `Classroom ${room.room_number} claimed successfully for ${claimDuration} minutes.`,
      claim: {
        id: claimId,
        classroomId,
        roomNumber: room.room_number,
        building: room.building,
        startTime: startSql,
        endTime: endSql,
        durationMinutes: claimDuration,
        purpose,
        status: 'active'
      }
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function releaseClassroomClaim(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const claimId = parseInt(req.params.id, 10);
    const userId = req.user.id;
    const userRole = req.user.role;

    await connection.beginTransaction();

    const [claims] = await connection.query(
      `SELECT cc.*, c.room_number 
       FROM classroom_claims cc
       JOIN classrooms c ON cc.classroom_id = c.id
       WHERE cc.id = ? FOR UPDATE`,
      [claimId]
    );

    if (claims.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Claim record not found.' });
    }

    const claim = claims[0];

    // Authorization: User must own the claim OR be hod/coordinator
    if (claim.user_id !== userId && userRole !== 'coordinator' && userRole !== 'hod') {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'You can only release your own active classroom claims.'
      });
    }

    if (claim.status !== 'active') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Claim is already ${claim.status}.`
      });
    }

    // Mark released
    await connection.query(
      `UPDATE classroom_claims SET status = 'released', released_at = NOW() WHERE id = ?`,
      [claimId]
    );

    // Reset classroom status back to 'available' if not under maintenance
    await connection.query(
      `UPDATE classrooms SET status = 'available', updated_at = NOW() WHERE id = ? AND status != 'maintenance'`,
      [claim.classroom_id]
    );

    await connection.commit();

    await logAudit({
      userId,
      action: 'CLASSROOM_RELEASED',
      entityType: 'classroom_claims',
      entityId: claimId,
      description: `${req.user.name} released temporary claim on classroom ${claim.room_number}.`,
      ipAddress: req.ip
    });

    await sendNotification({
      userId: claim.user_id,
      title: 'Classroom Claim Released',
      message: `Your claim for classroom ${claim.room_number} has been released. The room is now available for other faculty.`,
      type: 'claim'
    });

    res.json({
      success: true,
      message: `Classroom ${claim.room_number} released successfully.`
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

async function getMyClaims(req, res, next) {
  try {
    const userId = req.user.id;
    const [claims] = await pool.query(
      `SELECT cc.*, c.room_number, c.building, c.floor, c.type as room_type
       FROM classroom_claims cc
       JOIN classrooms c ON cc.classroom_id = c.id
       WHERE cc.user_id = ?
       ORDER BY cc.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: claims.length,
      data: claims
    });
  } catch (error) {
    next(error);
  }
}

async function getActiveClaims(req, res, next) {
  try {
    const [claims] = await pool.query(
      `SELECT cc.*, c.room_number, c.building, c.floor, u.name as claimed_by, u.role as user_role, u.department
       FROM classroom_claims cc
       JOIN classrooms c ON cc.classroom_id = c.id
       JOIN users u ON cc.user_id = u.id
       WHERE cc.status = 'active' AND cc.end_time > NOW()
       ORDER BY cc.end_time ASC`
    );

    res.json({
      success: true,
      count: claims.length,
      data: claims
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  claimClassroom,
  releaseClassroomClaim,
  getMyClaims,
  getActiveClaims
};
