const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Public to all authenticated campus users
router.get('/', authenticateToken, facilityController.getAllFacilities);
router.get('/:id', authenticateToken, facilityController.getFacilityById);

// Restricted to Program Coordinator
router.post('/', authenticateToken, authorizeRoles('coordinator'), facilityController.createFacility);
router.put('/:id', authenticateToken, authorizeRoles('coordinator'), facilityController.updateFacility);
router.delete('/:id', authenticateToken, authorizeRoles('coordinator'), facilityController.deleteFacility);

module.exports = router;
