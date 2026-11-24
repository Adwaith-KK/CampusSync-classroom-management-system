const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Students cannot create bookings
router.post('/', authenticateToken, authorizeRoles('faculty', 'hod', 'coordinator'), bookingController.createBookingRequest);
router.get('/my', authenticateToken, bookingController.getMyBookings);

// Management views (HOD and Coordinator)
router.get('/', authenticateToken, authorizeRoles('hod', 'coordinator'), bookingController.getAllBookings);
router.put('/:id/approve', authenticateToken, authorizeRoles('hod', 'coordinator'), bookingController.approveBooking);
router.put('/:id/reject', authenticateToken, authorizeRoles('hod', 'coordinator'), bookingController.rejectBooking);
router.put('/:id/cancel', authenticateToken, bookingController.cancelBooking);

module.exports = router;
