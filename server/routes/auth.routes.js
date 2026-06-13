const express = require('express');
const authRouter = express.Router();
const { register, login, getMe, updateProfile, getProfileOptimization } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', protect, getMe);
authRouter.put('/profile', protect, updateProfile);
authRouter.post('/profile/optimize', protect, getProfileOptimization);

module.exports = authRouter;
