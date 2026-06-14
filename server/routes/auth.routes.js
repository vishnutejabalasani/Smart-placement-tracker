const express = require('express');
const authRouter = express.Router();
const { register, login, getMe, updateProfile, getProfileOptimization, uploadResume, getResumeFile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', protect, getMe);
authRouter.put('/profile', protect, updateProfile);
authRouter.post('/profile/optimize', protect, getProfileOptimization);
authRouter.post('/profile/upload-resume', upload.single('resume'), uploadResume);
authRouter.get('/profile/resume/:userId', getResumeFile);

module.exports = authRouter;
