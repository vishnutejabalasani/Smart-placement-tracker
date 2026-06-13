const express = require('express');
const studentRouter = express.Router();
const { applyToJob, getStudentApplications, getAllApplicationsAdmin, updateApplicationStatus, getPlacementStats } = require('../controllers/student.controller');
const { startMockInterview, submitMockInterview, getMockInterviews } = require('../controllers/mockInterview.controller');
const { getAllAnomalies, updateAnomalyStatus } = require('../controllers/anomaly.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');
const { cgpaEligibilityAnomalyDetector } = require('../middleware/security.middleware');

studentRouter.post('/', protect, restrictTo('student'), cgpaEligibilityAnomalyDetector, applyToJob);
studentRouter.get('/student', protect, restrictTo('student'), getStudentApplications);
studentRouter.get('/admin', protect, restrictTo('admin'), getAllApplicationsAdmin);
studentRouter.put('/:id/status', protect, restrictTo('admin', 'student'), updateApplicationStatus);
studentRouter.get('/stats', protect, restrictTo('admin'), getPlacementStats);

// Security Anomaly Management
studentRouter.get('/anomalies', protect, restrictTo('admin'), getAllAnomalies);
studentRouter.put('/anomalies/:id', protect, restrictTo('admin'), updateAnomalyStatus);

// Mock Interview Simulation
studentRouter.post('/interview/start', protect, restrictTo('student'), startMockInterview);
studentRouter.post('/interview/:id/submit', protect, restrictTo('student'), submitMockInterview);
studentRouter.get('/interview/list', protect, restrictTo('student'), getMockInterviews);

module.exports = studentRouter;
