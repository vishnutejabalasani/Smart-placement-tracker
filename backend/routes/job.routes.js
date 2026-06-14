const express = require('express');
const jobRouter = express.Router();
const { createJob, getAllJobs, getJobById, updateJob, deleteJob } = require('../controllers/job.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

jobRouter.post('/', protect, restrictTo('admin'), createJob);
jobRouter.get('/', protect, getAllJobs);
jobRouter.get('/:id', protect, getJobById);
jobRouter.put('/:id', protect, restrictTo('admin'), updateJob);
jobRouter.delete('/:id', protect, restrictTo('admin'), deleteJob);

module.exports = jobRouter;
