const pool = require('../config/db');

/**
 * Check if a proposed timetable entry conflicts with existing entries
 * Rule: No room overlap AND no faculty double-booking
 */
async function checkTimetableConflict({ classroomId, facultyId, dayOfWeek, startTime, endTime, excludeId = null }) {
  // Check 1: Room conflict
  let roomQuery = `
    SELECT t.id, t.course_name, t.start_time, t.end_time, c.room_number, u.name as faculty_name
    FROM timetable t
    JOIN classrooms c ON t.classroom_id = c.id
    JOIN users u ON t.faculty_id = u.id
    WHERE t.classroom_id = ?
      AND t.day_of_week = ?
      AND (t.start_time < ? AND t.end_time > ?)
  `;
  const roomParams = [classroomId, dayOfWeek, endTime, startTime];
  if (excludeId) {
    roomQuery += ' AND t.id != ?';
    roomParams.push(excludeId);
  }
  const [roomCollisions] = await pool.query(roomQuery, roomParams);

  if (roomCollisions.length > 0) {
    const col = roomCollisions[0];
    return {
      hasConflict: true,
      type: 'ROOM_CONFLICT',
      message: `Classroom ${col.room_number} is already occupied on ${dayOfWeek} from ${col.start_time.slice(0,5)} to ${col.end_time.slice(0,5)} for "${col.course_name}" (${col.faculty_name}).`
    };
  }

  // Check 2: Faculty double-booking
  let facultyQuery = `
    SELECT t.id, t.course_name, t.start_time, t.end_time, c.room_number
    FROM timetable t
    JOIN classrooms c ON t.classroom_id = c.id
    WHERE t.faculty_id = ?
      AND t.day_of_week = ?
      AND (t.start_time < ? AND t.end_time > ?)
  `;
  const facultyParams = [facultyId, dayOfWeek, endTime, startTime];
  if (excludeId) {
    facultyQuery += ' AND t.id != ?';
    facultyParams.push(excludeId);
  }
  const [facultyCollisions] = await pool.query(facultyQuery, facultyParams);

  if (facultyCollisions.length > 0) {
    const col = facultyCollisions[0];
    return {
      hasConflict: true,
      type: 'FACULTY_DOUBLE_BOOKING',
      message: `Selected faculty is already scheduled to teach "${col.course_name}" in ${col.room_number} on ${dayOfWeek} from ${col.start_time.slice(0,5)} to ${col.end_time.slice(0,5)}.`
    };
  }

  return { hasConflict: false };
}

/**
 * Check if a temporary classroom claim conflicts with:
 * 1. An existing active claim
 * 2. An official timetable schedule during the claim period
 */
async function checkClaimConflict({ classroomId, startDateTime, endDateTime, connection = pool }) {
  // 1. Existing active claim
  const [activeClaims] = await connection.query(
    `SELECT id, user_id, start_time, end_time FROM classroom_claims
     WHERE classroom_id = ? 
       AND status = 'active'
       AND (start_time < ? AND end_time > ?)
     FOR UPDATE`,
    [classroomId, endDateTime, startDateTime]
  );

  if (activeClaims.length > 0) {
    return {
      hasConflict: true,
      message: 'Classroom is no longer available. An active temporary claim is in progress.'
    };
  }

  // 2. Official timetable collision for the day of week and time window
  // Derive day of week and times in HH:MM:SS format
  const startDate = new Date(startDateTime);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[startDate.getDay()];
  
  // Format times as HH:MM:SS
  const pad = (n) => String(n).padStart(2, '0');
  const startTimeStr = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}:${pad(startDate.getSeconds())}`;
  const endDate = new Date(endDateTime);
  const endTimeStr = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}:${pad(endDate.getSeconds())}`;

  const [timetableCollisions] = await connection.query(
    `SELECT t.id, t.course_name, t.start_time, t.end_time, u.name as faculty_name
     FROM timetable t
     JOIN users u ON t.faculty_id = u.id
     WHERE t.classroom_id = ?
       AND t.day_of_week = ?
       AND (t.start_time < ? AND t.end_time > ?)`,
    [classroomId, dayOfWeek, endTimeStr, startTimeStr]
  );

  if (timetableCollisions.length > 0) {
    const col = timetableCollisions[0];
    return {
      hasConflict: true,
      message: `Cannot claim: Room is scheduled on the official timetable for "${col.course_name}" (${col.faculty_name}) from ${col.start_time.slice(0,5)} to ${col.end_time.slice(0,5)}.`
    };
  }

  return { hasConflict: false };
}

/**
 * Check if a facility booking conflicts with existing approved bookings
 */
async function checkFacilityBookingConflict({ facilityId, bookingDate, startTime, endTime, excludeBookingId = null }) {
  let query = `
    SELECT fb.id, fb.purpose, fb.start_time, fb.end_time, u.name as requester_name
    FROM facility_bookings fb
    JOIN users u ON fb.user_id = u.id
    WHERE fb.facility_id = ?
      AND fb.booking_date = ?
      AND fb.status = 'approved'
      AND (fb.start_time < ? AND fb.end_time > ?)
  `;
  const params = [facilityId, bookingDate, endTime, startTime];
  if (excludeBookingId) {
    query += ' AND fb.id != ?';
    params.push(excludeBookingId);
  }

  const [collisions] = await pool.query(query, params);
  if (collisions.length > 0) {
    const col = collisions[0];
    return {
      hasConflict: true,
      message: `Facility is already booked during the selected time for "${col.purpose}" (${col.start_time.slice(0,5)} - ${col.end_time.slice(0,5)}).`
    };
  }

  return { hasConflict: false };
}

/**
 * Check if a planned future classroom booking conflicts with:
 * 1. Existing approved classroom booking
 * 2. Official timetable slot on that date
 */
async function checkClassroomBookingConflict({ classroomId, bookingDate, startTime, endTime, excludeBookingId = null }) {
  // Check 1: Approved bookings on that date
  let bookingQuery = `
    SELECT fb.id, fb.purpose, fb.start_time, fb.end_time, u.name as requester_name
    FROM facility_bookings fb
    JOIN users u ON fb.user_id = u.id
    WHERE fb.classroom_id = ?
      AND fb.booking_date = ?
      AND fb.status = 'approved'
      AND (fb.start_time < ? AND fb.end_time > ?)
  `;
  const bookingParams = [classroomId, bookingDate, endTime, startTime];
  if (excludeBookingId) {
    bookingQuery += ' AND fb.id != ?';
    bookingParams.push(excludeBookingId);
  }

  const [bookingCollisions] = await pool.query(bookingQuery, bookingParams);
  if (bookingCollisions.length > 0) {
    const col = bookingCollisions[0];
    return {
      hasConflict: true,
      message: `Classroom is already reserved on ${bookingDate} for "${col.purpose}" (${col.start_time.slice(0,5)} - ${col.end_time.slice(0,5)}).`
    };
  }

  // Check 2: Timetable conflict for that day of week
  const dateObj = new Date(bookingDate);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = days[dateObj.getDay()];

  const [timetableCollisions] = await pool.query(
    `SELECT t.id, t.course_name, t.start_time, t.end_time, u.name as faculty_name
     FROM timetable t
     JOIN users u ON t.faculty_id = u.id
     WHERE t.classroom_id = ?
       AND t.day_of_week = ?
       AND (t.start_time < ? AND t.end_time > ?)`,
    [classroomId, dayOfWeek, endTime, startTime]
  );

  if (timetableCollisions.length > 0) {
    const col = timetableCollisions[0];
    return {
      hasConflict: true,
      message: `Classroom has a scheduled class "${col.course_name}" on ${dayOfWeek} from ${col.start_time.slice(0,5)} to ${col.end_time.slice(0,5)}.`
    };
  }

  return { hasConflict: false };
}

module.exports = {
  checkTimetableConflict,
  checkClaimConflict,
  checkFacilityBookingConflict,
  checkClassroomBookingConflict
};
