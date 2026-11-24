const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// View user list: HOD and Coordinator
router.get('/', authenticateToken, authorizeRoles('hod', 'coordinator'), userController.getAllUsers);
router.get('/:id', authenticateToken, authorizeRoles('hod', 'coordinator'), userController.getUserById);

// Status modification: Coordinator and HOD
router.put('/:id/status', authenticateToken, authorizeRoles('coordinator', 'hod'), userController.updateUserStatus);

module.exports = router;
