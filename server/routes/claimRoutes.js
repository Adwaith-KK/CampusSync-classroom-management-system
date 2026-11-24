const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Students can NEVER claim classrooms
router.post('/classrooms/:id/claim', authenticateToken, authorizeRoles('faculty', 'hod', 'coordinator'), claimController.claimClassroom);
router.post('/classroom-claims/:id/release', authenticateToken, authorizeRoles('faculty', 'hod', 'coordinator'), claimController.releaseClassroomClaim);
router.get('/classroom-claims/my', authenticateToken, authorizeRoles('faculty', 'hod', 'coordinator'), claimController.getMyClaims);
router.get('/classroom-claims/active', authenticateToken, claimController.getActiveClaims);

module.exports = router;
