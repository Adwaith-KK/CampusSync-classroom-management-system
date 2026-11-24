const pool = require('../config/db');
const { checkFacilityBookingConflict, checkClassroomBookingConflict } = require('../services/conflictService');
const { logAudit } = require('../services/auditService');
const { sendNotification, notifyRoles } = require('../services/notificationService');

/**
 * Submit a booking request for either a facility (auditorium, court, etc.)
 * or a planned future classroom event.
 */
async function createBookingRequest(req, res, next) {
  try {
    const userId = req.user.id;
    const { 
      bookingType = 'facility', // 'facility' | 'classroom'
      facilityId, 
      classroomId, 
      purpose, 
      description = '', 
      bookingDate, 
      startTime, 
      endTime, 
      participants = 1 
    } = req.body;

    if (!purpose || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Purpose, booking date, start time, and end time are required.'
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be earlier than end time.'
      });
    }

    // Booking date must be today or in the future
    const todayStr = new Date().toISOString().split('T')[0];
    if (bookingDate < todayStr) {
      return res.status(400).json({
        success: false,
        message: 'Booking date cannot be in the past.'
      });
    }

    let approverRole = 'coordinator';
    let entityName = '';

    if (bookingType === 'classroom') {
      if (!classroomId) {
        return res.status(400).json({ success: false, message: 'Classroom selection is required for classroom event bookings.' });
      }

      const [rooms] = await pool.query('SELECT room_number, building, capacity, status FROM classrooms WHERE id = ?', [classroomId]);
      if (rooms.length === 0) {
        return res.status(404).json({ success: false, message: 'Classroom not found.' });
      }
      if (rooms[0].status === 'maintenance') {
        return res.status(400).json({ success: false, message: 'Classroom is under maintenance and cannot be booked.' });
      }

      entityName = `Classroom ${rooms[0].room_number}`;
      // Rule: Planned future classroom usage routes to HOD for approval
      approverRole = 'hod';

      // Check for conflicts with already approved bookings or timetable schedules
      const conflict = await checkClassroomBookingConflict({
        classroomId,
        bookingDate,
        startTime,
        endTime
      });

      if (conflict.hasConflict) {
        return res.status(409).json({ success: false, message: conflict.message });
      }
    } else {
      if (!facilityId) {
        return res.status(400).json({ success: false, message: 'Facility selection is required.' });
      }

      const [facs] = await pool.query('SELECT name, capacity, status, type FROM facilities WHERE id = ?', [facilityId]);
      if (facs.length === 0) {
        return res.status(404).json({ success: false, message: 'Facility not found.' });
      }
      if (facs[0].status !== 'available') {
        return res.status(400).json({ success: false, message: 'Facility is currently not available for bookings.' });
      }

      entityName = facs[0].name;
      // High-capacity or seminar halls may route to HOD, sports/regular to coordinator
      approverRole = (facs[0].type === 'Seminar Hall' || facs[0].type === 'Conference Room') ? 'hod' : 'coordinator';

      // Check conflict with existing approved bookings
      const conflict = await checkFacilityBookingConflict({
        facilityId,
        bookingDate,
        startTime,
        endTime
      });

      if (conflict.hasConflict) {
        return res.status(409).json({ success: false, message: conflict.message });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO facility_bookings 
       (facility_id, classroom_id, booking_type, user_id, purpose, description, booking_date, start_time, end_time, participants, approver_role, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        bookingType === 'facility' ? facilityId : null,
        bookingType === 'classroom' ? classroomId : null,
        bookingType,
        userId,
        purpose.trim(),
        description.trim(),
        bookingDate,
        startTime,
        endTime,
        parseInt(participants, 10) || 1,
        approverRole
      ]
    );

    const bookingId = result.insertId;

    await logAudit({
      userId,
      action: 'BOOKING_REQUESTED',
      entityType: 'facility_bookings',
      entityId: bookingId,
      description: `${req.user.name} submitted booking request for ${entityName} on ${bookingDate} (${startTime}-${endTime}). Awaiting ${approverRole.toUpperCase()} review.`,
      ipAddress: req.ip
    });

    // Notify appropriate approvers
    await notifyRoles({
      roles: [approverRole],
      title: 'New Booking Request Pending Review',
      message: `${req.user.name} requested ${entityName} for "${purpose}" on ${bookingDate} (${startTime.slice(0,5)} - ${endTime.slice(0,5)}).`,
      type: 'booking'
    });

    res.status(201).json({
      success: true,
      message: `Booking request for ${entityName} submitted successfully. Pending ${approverRole.toUpperCase()} approval.`,
      bookingId,
      status: 'pending',
      approverRole
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user's submitted bookings
 */
async function getMyBookings(req, res, next) {
  try {
    const userId = req.user.id;
    const [bookings] = await pool.query(
      `SELECT 
        fb.*, 
        f.name as facility_name, f.type as facility_type, f.location as facility_location,
        c.room_number, c.building,
        u_rev.name as reviewer_name
       FROM facility_bookings fb
       LEFT JOIN facilities f ON fb.facility_id = f.id
       LEFT JOIN classrooms c ON fb.classroom_id = c.id
       LEFT JOIN users u_rev ON fb.reviewed_by = u_rev.id
       WHERE fb.user_id = ?
       ORDER BY fb.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get bookings for Review / Management
 * HOD: Sees bookings assigned to HOD or within their department scope
 * Coordinator: Sees bookings assigned to Coordinator or all campus bookings
 */
async function getAllBookings(req, res, next) {
  try {
    const { status, bookingType, date } = req.query;
    const userRole = req.user.role;

    let sql = `
      SELECT 
        fb.*, 
        f.name as facility_name, f.type as facility_type, f.location as facility_location,
        c.room_number, c.building,
        u_req.name as requester_name, u_req.email as requester_email, u_req.department as requester_dept, u_req.role as requester_role,
        u_rev.name as reviewer_name
      FROM facility_bookings fb
      LEFT JOIN facilities f ON fb.facility_id = f.id
      LEFT JOIN classrooms c ON fb.classroom_id = c.id
      JOIN users u_req ON fb.user_id = u_req.id
      LEFT JOIN users u_rev ON fb.reviewed_by = u_rev.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by approver role assignment if applicable
    if (userRole === 'hod') {
      sql += ` AND (fb.approver_role = 'hod' OR u_req.department = ?)`;
      params.push(req.user.department);
    } else if (userRole === 'coordinator') {
      // Coordinator oversees campus requests
      // No extra role filter needed so coordinator can coordinate all facilities
    }

    if (status) {
      sql += ' AND fb.status = ?';
      params.push(status);
    }
    if (bookingType) {
      sql += ' AND fb.booking_type = ?';
      params.push(bookingType);
    }
    if (date) {
      sql += ' AND fb.booking_date = ?';
      params.push(date);
    }

    sql += ' ORDER BY fb.booking_date DESC, fb.start_time DESC';

    const [bookings] = await pool.query(sql, params);

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Approve a pending booking request
 * Validates:
 * 1. User has permission to approve (HOD or Coordinator)
 * 2. Requester cannot approve their own booking
 * 3. Atomic conflict check prevents overlapping approved requests
 */
async function approveBooking(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const bookingId = parseInt(req.params.id, 10);
    const reviewerId = req.user.id;
    const reviewerRole = req.user.role;

    await connection.beginTransaction();

    const [bookings] = await connection.query(
      `SELECT fb.*, u.name as requester_name, f.name as facility_name, c.room_number
       FROM facility_bookings fb
       JOIN users u ON fb.user_id = u.id
       LEFT JOIN facilities f ON fb.facility_id = f.id
       LEFT JOIN classrooms c ON fb.classroom_id = c.id
       WHERE fb.id = ? FOR UPDATE`,
      [bookingId]
    );

    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }

    const booking = bookings[0];

    // Rule: Requester cannot approve their own booking
    if (booking.user_id === reviewerId) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Security policy violation: You cannot approve your own booking request.'
      });
    }

    // Role check: Only HOD or Coordinator
    if (reviewerRole !== 'hod' && reviewerRole !== 'coordinator') {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only HOD or Program Coordinator can approve booking requests.'
      });
    }

    if (booking.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: `Booking request is already ${booking.status}.`
      });
    }

    // Atomic overlap verification before approving
    if (booking.booking_type === 'classroom') {
      const conflict = await checkClassroomBookingConflict({
        classroomId: booking.classroom_id,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        excludeBookingId: booking.id
      });
      if (conflict.hasConflict) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: conflict.message });
      }
    } else {
      const conflict = await checkFacilityBookingConflict({
        facilityId: booking.facility_id,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        excludeBookingId: booking.id
      });
      if (conflict.hasConflict) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: conflict.message });
      }
    }

    // Mark as approved
    await connection.query(
      `UPDATE facility_bookings 
       SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() 
       WHERE id = ?`,
      [reviewerId, bookingId]
    );

    await connection.commit();

    const resourceName = booking.booking_type === 'classroom' ? `Classroom ${booking.room_number}` : booking.facility_name;

    await logAudit({
      userId: reviewerId,
      action: 'BOOKING_APPROVED',
      entityType: 'facility_bookings',
      entityId: bookingId,
      description: `${req.user.name} (${reviewerRole.toUpperCase()}) approved booking #${bookingId} for ${resourceName} on ${booking.booking_date}.`,
      ipAddress: req.ip
    });

    await sendNotification({
      userId: booking.user_id,
      title: 'Booking Request Approved',
      message: `Your booking for ${resourceName} on ${booking.booking_date} (${booking.start_time.slice(0,5)} - ${booking.end_time.slice(0,5)}) has been APPROVED by ${req.user.name}.`,
      type: 'booking'
    });

    res.json({
      success: true,
      message: `Booking request #${bookingId} has been approved successfully.`
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
}

/**
 * Reject a pending booking request
 * Requires rejection reason
 */
async function rejectBooking(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { reason } = req.body;
    const reviewerId = req.user.id;
    const reviewerRole = req.user.role;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is required to reject a booking.'
      });
    }

    const [bookings] = await pool.query(
      `SELECT fb.*, u.name as requester_name, f.name as facility_name, c.room_number
       FROM facility_bookings fb
       JOIN users u ON fb.user_id = u.id
       LEFT JOIN facilities f ON fb.facility_id = f.id
       LEFT JOIN classrooms c ON fb.classroom_id = c.id
       WHERE fb.id = ?`,
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking request not found.' });
    }

    const booking = bookings[0];

    if (booking.user_id === reviewerId) {
      return res.status(403).json({
        success: false,
        message: 'Security policy violation: You cannot reject your own booking request.'
      });
    }

    if (reviewerRole !== 'hod' && reviewerRole !== 'coordinator') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only HOD or Program Coordinator can reject booking requests.'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Booking request is already ${booking.status}.`
      });
    }

    await pool.query(
      `UPDATE facility_bookings 
       SET status = 'rejected', rejection_reason = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() 
       WHERE id = ?`,
      [reason.trim(), reviewerId, bookingId]
    );

    const resourceName = booking.booking_type === 'classroom' ? `Classroom ${booking.room_number}` : booking.facility_name;

    await logAudit({
      userId: reviewerId,
      action: 'BOOKING_REJECTED',
      entityType: 'facility_bookings',
      entityId: bookingId,
      description: `${req.user.name} (${reviewerRole.toUpperCase()}) rejected booking #${bookingId} for ${resourceName}. Reason: ${reason}`,
      ipAddress: req.ip
    });

    await sendNotification({
      userId: booking.user_id,
      title: 'Booking Request Rejected',
      message: `Your booking for ${resourceName} on ${booking.booking_date} was rejected. Reason: ${reason}`,
      type: 'booking'
    });

    res.json({
      success: true,
      message: `Booking request #${bookingId} has been rejected.`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel a booking request (by the requester)
 */
async function cancelBooking(req, res, next) {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    const [bookings] = await pool.query(
      `SELECT * FROM facility_bookings WHERE id = ?`,
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookings[0];

    if (booking.user_id !== userId && req.user.role !== 'coordinator' && req.user.role !== 'hod') {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own bookings.'
      });
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: `Booking is already ${booking.status}.`
      });
    }

    await pool.query(
      `UPDATE facility_bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ?`,
      [bookingId]
    );

    await logAudit({
      userId,
      action: 'BOOKING_CANCELLED',
      entityType: 'facility_bookings',
      entityId: bookingId,
      description: `${req.user.name} cancelled booking #${bookingId}.`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully.'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBookingRequest,
  getMyBookings,
  getAllBookings,
  approveBooking,
  rejectBooking,
  cancelBooking
};
