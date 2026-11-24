const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

router.get('/', authenticateToken, notificationController.getMyNotifications);
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);
router.put('/:id/read', authenticateToken, notificationController.markAsRead);

// Announcements restricted to HOD and Coordinator
router.post('/announcement', authenticateToken, authorizeRoles('hod', 'coordinator'), notificationController.broadcastAnnouncement);

module.exports = router;
