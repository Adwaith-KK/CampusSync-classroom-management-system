const pool = require('../config/db');
const { getClassroomsWithAvailability } = require('../services/availabilityService');

async function getAnalyticsOverview(req, res, next) {
  try {
    const userRole = req.user.role;
    const userDept = req.user.department;

    // 1. Live classroom status breakdown
    const allClassrooms = await getClassroomsWithAvailability();
    const totalClassrooms = allClassrooms.length;
    const availableCount = allClassrooms.filter(c => c.status === 'available').length;
    const claimedCount = allClassrooms.filter(c => c.status === 'temporarily_claimed').length;
    const scheduledCount = allClassrooms.filter(c => c.status === 'scheduled').length;
    const occupiedCount = allClassrooms.filter(c => c.status === 'occupied').length;
    const maintenanceCount = allClassrooms.filter(c => c.status === 'maintenance').length;

    // Utilization rate
    const inUseCount = claimedCount + scheduledCount + occupiedCount;
    const classroomUtilizationRate = totalClassrooms > 0 ? Math.round((inUseCount / totalClassrooms) * 100) : 0;

    // 2. Facilities count
    const [facilities] = await pool.query('SELECT COUNT(*) as count FROM facilities');
    const totalFacilities = facilities[0].count;

    // 3. Bookings breakdown
    let bookingScopeSql = '';
    const bookingParams = [];
    if (userRole === 'hod') {
      bookingScopeSql = ' WHERE user_id IN (SELECT id FROM users WHERE department = ?)';
      bookingParams.push(userDept);
    }

    const [bookingStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_bookings,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_bookings,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_bookings
      FROM facility_bookings
      ${bookingScopeSql}
    `, bookingParams);

    // 4. Most frequently claimed classrooms
    const [topClaimedRooms] = await pool.query(`
      SELECT c.room_number, c.building, COUNT(cc.id) as claim_count
      FROM classroom_claims cc
      JOIN classrooms c ON cc.classroom_id = c.id
      GROUP BY c.id, c.room_number, c.building
      ORDER BY claim_count DESC
      LIMIT 5
    `);

    // 5. Most booked facilities
    const [topFacilities] = await pool.query(`
      SELECT f.name, f.type, COUNT(fb.id) as booking_count
      FROM facility_bookings fb
      JOIN facilities f ON fb.facility_id = f.id
      WHERE fb.status = 'approved'
      GROUP BY f.id, f.name, f.type
      ORDER BY booking_count DESC
      LIMIT 5
    `);

    // 6. Booking trends by day of week
    const [dayTrends] = await pool.query(`
      SELECT DAYNAME(booking_date) as day_name, COUNT(*) as count
      FROM facility_bookings
      WHERE booking_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      GROUP BY DAYNAME(booking_date), DAYOFWEEK(booking_date)
      ORDER BY DAYOFWEEK(booking_date) ASC
    `);

    // 7. Total active users count (for coordinators)
    const [userCounts] = await pool.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE status = 'active' 
      GROUP BY role
    `);

    res.json({
      success: true,
      data: {
        classrooms: {
          total: totalClassrooms,
          available: availableCount,
          claimed: claimedCount,
          scheduled: scheduledCount,
          occupied: occupiedCount,
          maintenance: maintenanceCount,
          utilizationRate: classroomUtilizationRate,
          topClaimed: topClaimedRooms
        },
        facilities: {
          total: totalFacilities,
          topBooked: topFacilities
        },
        bookings: {
          total: bookingStats[0].total_bookings || 0,
          pending: bookingStats[0].pending_bookings || 0,
          approved: bookingStats[0].approved_bookings || 0,
          rejected: bookingStats[0].rejected_bookings || 0,
          cancelled: bookingStats[0].cancelled_bookings || 0,
          trends: dayTrends
        },
        users: userCounts
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAnalyticsOverview
};
