const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// View timetable accessible to all authenticated users
router.get('/', authenticateToken, timetableController.getTimetable);

// Management restricted to Program Coordinator
router.post('/', authenticateToken, authorizeRoles('coordinator'), timetableController.createTimetableEntry);
router.put('/:id', authenticateToken, authorizeRoles('coordinator'), timetableController.updateTimetableEntry);
router.delete('/:id', authenticateToken, authorizeRoles('coordinator'), timetableController.deleteTimetableEntry);

module.exports = router;
