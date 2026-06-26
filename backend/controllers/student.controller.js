const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { evaluateResumeMatch } = require('../services/gemini.service');
const { sendNotification } = require('../services/socket.service');

/**
 * Student applies for a job listing - triggers Gemini AI matching instantly
 */
const applyToJob = async (req, res, next) => {
  const { jobId } = req.body;
  const studentId = req.user.id;

  try {
    const existingApp = await Application.findOne({ student: studentId, job: jobId });
    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied or added this job to your board'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Check if the application deadline has passed
    if (job.deadline && new Date() > new Date(job.deadline)) {
      return res.status(400).json({
        success: false,
        message: 'The application deadline for this job has passed.'
      });
    }

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    const studentProfileText = `
      Name: ${student.name}
      Branch: ${student.profile?.branch || 'N/A'}
      CGPA: ${student.profile?.cgpa || 0.0}
      Skills: ${student.profile?.skills?.join(', ') || 'None listed'}
      Resume Content: ${student.profile?.resumeText || 'No resume uploaded.'}
    `;

    const jobDescriptionText = `
      Company: ${job.companyName}
      Role: ${job.role}
      Description: ${job.description}
      Requirements: ${job.requirements?.join(', ') || 'N/A'}
      CGPA Cutoff: ${job.cgpaCutoff}
    `;

    console.log(`Running AI Resume Matcher for ${student.name} and ${job.companyName}...`);
    const aiEvaluation = await evaluateResumeMatch(studentProfileText, jobDescriptionText);

    const application = await Application.create({
      student: studentId,
      job: jobId,
      status: 'Applied', 
      matchScore: aiEvaluation.matchScore,
      recommendedKeywords: aiEvaluation.recommendedKeywords,
      matchFeedback: aiEvaluation.matchFeedback
    });

    return res.status(201).json({
      success: true,
      message: 'Applied successfully. AI resume match analysis completed.',
      application
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch all applications submitted by the logged-in student
 */
const getStudentApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ student: req.user.id })
      .populate('job')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch all applications (Admin only - allows reviewing applicant pool)
 */
const getAllApplicationsAdmin = async (req, res, next) => {
  try {
    const applications = await Application.find()
      .populate('student', 'name email profile')
      .populate('job', 'companyName role package')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update the Kanban status of an application and broadcast WebSocket notifications
 */
const updateApplicationStatus = async (req, res, next) => {
  const { status } = req.body;
  const { id } = req.params; 

  try {
    const application = await Application.findById(id)
      .populate('student', '_id name email')
      .populate('job', 'companyName role');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Role restriction check for students
    if (req.user.role === 'student') {
      if (application.student._id.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to modify this application.'
        });
      }
      
      if (status === 'Offered' || status === 'Rejected') {
        return res.status(403).json({
          success: false,
          message: 'Promotions to Offered or Rejected require Placement Admin verification.'
        });
      }
    }

    const oldStatus = application.status;
    application.status = status;
    await application.save();

    const studentId = application.student._id;
    const notificationPayload = {
      applicationId: application._id,
      companyName: application.job.companyName,
      role: application.job.role,
      oldStatus,
      newStatus: status,
      message: `Your application status for ${application.job.companyName} (${application.job.role}) has been updated from "${oldStatus}" to "${status}".`
    };

    console.log(`[STATUS PUSH] Application ${id} updated to ${status}. Notifying student ${studentId}...`);
    sendNotification(studentId, 'APPLICATION_STATUS_UPDATED', notificationPayload);

    return res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      application
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve placement statistics for Admin Dashboard metrics
 */
const getPlacementStats = async (req, res, next) => {
  try {
    const totalApplications = await Application.countDocuments();
    const totalPlaced = await Application.countDocuments({ status: 'Offered' });
    const activeJobs = await Job.countDocuments({ active: true });

    const placedApps = await Application.find({ status: 'Offered' }).populate('job');
    
    let averagePackage = 0.0;
    if (placedApps.length > 0) {
      const totalPackageSum = placedApps.reduce((acc, app) => acc + (app.job?.package || 0.0), 0.0);
      averagePackage = Number((totalPackageSum / placedApps.length).toFixed(2));
    }

    const stages = ['Wishlist', 'Applied', 'OA', 'Interview', 'Offered', 'Rejected'];
    const stageBreakdown = {};
    for (const stage of stages) {
      stageBreakdown[stage] = await Application.countDocuments({ status: stage });
    }

    const branchPlacements = {};
    const packageBrackets = { under5: 0, between5and10: 0, between10and15: 0, above15: 0 };

    for (const app of placedApps) {
      const student = await User.findById(app.student);
      if (student && student.profile?.branch) {
        const br = student.profile.branch.toUpperCase();
        branchPlacements[br] = (branchPlacements[br] || 0) + 1;
      }
      
      const pkg = app.job?.package || 0.0;
      if (pkg < 5.0) {
        packageBrackets.under5++;
      } else if (pkg < 10.0) {
        packageBrackets.between5and10++;
      } else if (pkg < 15.0) {
        packageBrackets.between10and15++;
      } else {
        packageBrackets.above15++;
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalApplications,
        totalPlaced,
        activeJobs,
        averagePackage,
        stageBreakdown,
        branchPlacements,
        packageBrackets
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToJob,
  getStudentApplications,
  getAllApplicationsAdmin,
  updateApplicationStatus,
  getPlacementStats
};
