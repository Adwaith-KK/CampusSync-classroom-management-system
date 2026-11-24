const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Restricted strictly to management roles: HOD and Program Coordinator
router.get('/overview', authenticateToken, authorizeRoles('hod', 'coordinator'), analyticsController.getAnalyticsOverview);

module.exports = router;
