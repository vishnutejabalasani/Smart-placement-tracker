const User = require('../models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const pdfParse = require('pdf-parse');

// Helper to generate JWT tokens
const generateToken = (id, role, email) => {
  return jwt.sign(
    { id, role, email },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '30d' }
  );
};

/**
 * Register a new user (Student or Admin)
 */
const register = async (req, res, next) => {
  const { name, email, password, role, profile } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with that email already exists'
      });
    }

    const userRole = role === 'admin' ? 'admin' : 'student';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      profile: userRole === 'student' ? {
        cgpa: profile?.cgpa || 0.0,
        branch: profile?.branch || '',
        skills: profile?.skills || [],
        resumeText: profile?.resumeText || '',
        resumeUrl: profile?.resumeUrl || '',
        phone: profile?.phone || ''
      } : undefined
    });

    const token = generateToken(user._id, user.role, user.email);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log in an existing user
 */
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.profile && user.profile.phone && user.profile.phone.startsWith('[BANNED]')) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended due to security policy violations.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = generateToken(user._id, user.role, user.email);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch details of the current logged-in user
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update student profile (Skills, CGPA, Resume text, etc.)
 */
const updateProfile = async (req, res, next) => {
  const { cgpa, skills, resumeText, resumeUrl, branch, phone } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    if (user.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Only students can update profile fields'
      });
    }

    user.profile.cgpa = cgpa !== undefined ? Number(cgpa) : user.profile.cgpa;
    user.profile.branch = branch !== undefined ? branch : user.profile.branch;
    user.profile.phone = phone !== undefined ? phone : user.profile.phone;
    user.profile.resumeText = resumeText !== undefined ? resumeText : user.profile.resumeText;
    user.profile.resumeUrl = resumeUrl !== undefined ? resumeUrl : user.profile.resumeUrl;
    
    if (skills !== undefined) {
      user.profile.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    next(error);
  }
};

const { optimizeProfile } = require('../services/gemini.service');
const Job = require('../models/Job');

const getProfileOptimization = async (req, res, next) => {
  const { jobId } = req.body;
  const studentId = req.user.id;

  try {
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Target job opening not found'
      });
    }

    const studentProfileText = `
      Name: ${student.name}
      Branch: ${student.profile?.branch || 'N/A'}
      Skills: ${student.profile?.skills?.join(', ') || 'None listed'}
      Resume Content: ${student.profile?.resumeText || 'No resume uploaded.'}
    `;

    const jobDescriptionText = `
      Company: ${job.companyName}
      Role: ${job.role}
      Description: ${job.description}
      Requirements: ${job.requirements?.join(', ') || 'N/A'}
    `;

    console.log(`Running AI Profile Optimizer for student ${student.name} targeting ${job.companyName}...`);
    const suggestions = await optimizeProfile(studentProfileText, jobDescriptionText);

    return res.status(200).json({
      success: true,
      message: 'AI resume optimization suggestions generated successfully.',
      suggestions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public/Private Resume Upload & Parser (uses memory buffer for cloud compatibility)
 */
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    let resumeText = '';

    if (req.file.mimetype === 'application/pdf') {
      const parser = new pdfParse.PDFParse({ data: req.file.buffer });
      const parsedData = await parser.getText();
      await parser.destroy();
      resumeText = parsedData.text;
    } else if (req.file.mimetype === 'text/plain') {
      resumeText = req.file.buffer.toString('utf8');
    }

    // Convert buffer to base64 Data URL
    const base64Data = req.file.buffer.toString('base64');
    const resumeUrl = `data:${req.file.mimetype};base64,${base64Data}`;

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
      resumeUrl,
      resumeText: resumeText.trim(),
      fileName: req.file.originalname
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Dynamically serve/download resume from database
 */
const getResumeFile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.profile?.resumeUrl) {
      return res.status(404).send('Resume file not found');
    }

    const resumeUrl = user.profile.resumeUrl;
    if (resumeUrl.startsWith('data:')) {
      const matches = resumeUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).send('Invalid resume data format');
      }
      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      res.set('Content-Type', contentType);
      res.set('Content-Disposition', `inline; filename="resume_${req.params.userId}.${contentType.split('/')[1] === 'pdf' ? 'pdf' : 'txt'}"`);
      return res.send(buffer);
    } else {
      // Seeded URL
      return res.redirect(resumeUrl);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  getProfileOptimization,
  uploadResume,
  getResumeFile
};
