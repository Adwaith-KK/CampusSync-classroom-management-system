const pool = require('../config/db');

/**
 * Computes real-time availability for all classrooms or a single classroom.
 * Combines:
 * 1. Static status (maintenance)
 * 2. Active temporary claims
 * 3. Real-time timetable schedules
 * 4. Approved event bookings
 */
async function getClassroomsWithAvailability(classroomId = null) {
  // Current time in UTC/Local context
  const now = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = days[now.getDay()];
  
  const pad = (n) => String(n).padStart(2, '0');
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const currentDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  let sql = `
    SELECT 
      c.id, c.room_number, c.building, c.floor, c.capacity, c.type, c.status as base_status, c.features,
      -- Active temporary claim
      cc.id as claim_id, cc.user_id as claim_user_id, u_claim.name as claim_user_name,
      cc.start_time as claim_start, cc.end_time as claim_end, cc.purpose as claim_purpose,
      -- Timetable entry at current time
      tt.id as timetable_id, tt.course_name as current_course, tt.course_code as current_course_code,
      tt.start_time as tt_start, tt.end_time as tt_end, u_fac.name as tt_faculty_name,
      -- Approved booking today at current time
      fb.id as booking_id, fb.purpose as booking_purpose, fb.start_time as fb_start, fb.end_time as fb_end,
      u_book.name as booking_user_name
    FROM classrooms c
    -- Left join active claim
    LEFT JOIN classroom_claims cc ON c.id = cc.classroom_id 
      AND cc.status = 'active'
      AND cc.start_time <= NOW()
      AND cc.end_time > NOW()
    LEFT JOIN users u_claim ON cc.user_id = u_claim.id
    -- Left join active timetable slot
    LEFT JOIN timetable tt ON c.id = tt.classroom_id
      AND tt.day_of_week = ?
      AND (tt.start_time <= ? AND tt.end_time > ?)
    LEFT JOIN users u_fac ON tt.faculty_id = u_fac.id
    -- Left join active approved booking
    LEFT JOIN facility_bookings fb ON c.id = fb.classroom_id
      AND fb.booking_date = ?
      AND fb.status = 'approved'
      AND (fb.start_time <= ? AND fb.end_time > ?)
    LEFT JOIN users u_book ON fb.user_id = u_book.id
  `;

  const params = [currentDay, currentTime, currentTime, currentDate, currentTime, currentTime];

  if (classroomId) {
    sql += ' WHERE c.id = ?';
    params.push(classroomId);
  }

  sql += ' ORDER BY c.building ASC, c.room_number ASC';

  const [rows] = await pool.query(sql, params);

  return rows.map(row => {
    let computedStatus = 'available';
    let occupancyDetails = null;

    if (row.base_status === 'maintenance') {
      computedStatus = 'maintenance';
      occupancyDetails = { reason: 'Room under scheduled maintenance' };
    } else if (row.claim_id) {
      computedStatus = 'temporarily_claimed';
      const claimEnd = new Date(row.claim_end);
      const remainingSeconds = Math.max(0, Math.floor((claimEnd - new Date()) / 1000));
      occupancyDetails = {
        type: 'temporary_claim',
        claimId: row.claim_id,
        userId: row.claim_user_id,
        userName: row.claim_user_name,
        purpose: row.claim_purpose,
        startTime: row.claim_start,
        endTime: row.claim_end,
        remainingSeconds
      };
    } else if (row.timetable_id) {
      computedStatus = 'scheduled';
      occupancyDetails = {
        type: 'timetable',
        courseName: row.current_course,
        courseCode: row.current_course_code,
        facultyName: row.tt_faculty_name,
        startTime: row.tt_start ? row.tt_start.slice(0, 5) : '',
        endTime: row.tt_end ? row.tt_end.slice(0, 5) : ''
      };
    } else if (row.booking_id) {
      computedStatus = 'occupied';
      occupancyDetails = {
        type: 'event_booking',
        purpose: row.booking_purpose,
        bookedBy: row.booking_user_name,
        startTime: row.fb_start ? row.fb_start.slice(0, 5) : '',
        endTime: row.fb_end ? row.fb_end.slice(0, 5) : ''
      };
    }

    return {
      id: row.id,
      roomNumber: row.room_number,
      building: row.building,
      floor: row.floor,
      capacity: row.capacity,
      type: row.type,
      features: row.features,
      status: computedStatus,
      occupancyDetails
    };
  });
}

module.exports = {
  getClassroomsWithAvailability
};
