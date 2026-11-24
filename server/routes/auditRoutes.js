const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Audit logs are read-only and restricted to HOD and Program Coordinator
router.get('/', authenticateToken, authorizeRoles('hod', 'coordinator'), auditController.getAuditLogs);

module.exports = router;
