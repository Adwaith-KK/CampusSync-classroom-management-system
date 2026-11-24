const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const authenticateToken = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

// Public to all authenticated users (Student, Faculty, HOD, Coordinator)
router.get('/', authenticateToken, classroomController.getAllClassrooms);
router.get('/:id', authenticateToken, classroomController.getClassroomById);

// Restricted to Program Coordinator
router.post('/', authenticateToken, authorizeRoles('coordinator'), classroomController.createClassroom);
router.put('/:id', authenticateToken, authorizeRoles('coordinator'), classroomController.updateClassroom);
router.delete('/:id', authenticateToken, authorizeRoles('coordinator'), classroomController.deleteClassroom);

module.exports = router;
