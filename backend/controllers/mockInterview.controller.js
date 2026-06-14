const MockInterview = require('../models/MockInterview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { generateMockQuestions, evaluateMockAnswers } = require('../services/gemini.service');

const startMockInterview = async (req, res, next) => {
  const { applicationId } = req.body;
  const studentId = req.user.id;

  try {
    const application = await Application.findById(applicationId).populate('job');
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to start a mock interview for this application'
      });
    }

    const student = await User.findById(studentId);
    const job = application.job;

    // Check if there is an active incomplete interview for this job/application
    let interview = await MockInterview.findOne({
      student: studentId,
      application: applicationId,
      completed: false
    });

    if (interview) {
      return res.status(200).json({
        success: true,
        message: 'Resuming your active mock interview session.',
        interview
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

    console.log(`Generating AI Mock Interview questions for student: ${student.name} | Job: ${job.companyName}`);
    const questions = await generateMockQuestions(studentProfileText, jobDescriptionText);

    interview = await MockInterview.create({
      student: studentId,
      application: applicationId,
      job: job._id,
      questions,
      answers: [],
      completed: false
    });

    return res.status(201).json({
      success: true,
      message: 'New AI Mock Interview session generated successfully.',
      interview
    });
  } catch (error) {
    next(error);
  }
};

const submitMockInterview = async (req, res, next) => {
  const { id } = req.params;
  const { answers } = req.body; // Array of strings (answers matching the questions)
  const studentId = req.user.id;

  try {
    const interview = await MockInterview.findById(id).populate('job');
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Mock interview session not found'
      });
    }

    if (interview.student.toString() !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit this session'
      });
    }

    const job = interview.job;
    const jobDescriptionText = `
      Company: ${job.companyName}
      Role: ${job.role}
      Description: ${job.description}
    `;

    console.log(`Evaluating AI Mock Interview answers for session: ${id}`);
    const evaluation = await evaluateMockAnswers(interview.questions, answers, jobDescriptionText);

    interview.answers = answers;
    interview.feedback = evaluation.feedback;
    interview.score = evaluation.score;
    interview.completed = true;
    await interview.save();

    return res.status(200).json({
      success: true,
      message: 'Mock interview submitted and evaluated successfully by Gemini.',
      interview
    });
  } catch (error) {
    next(error);
  }
};

const getMockInterviews = async (req, res, next) => {
  try {
    const interviews = await MockInterview.find({ student: req.user.id })
      .populate('job', 'companyName role package')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: interviews.length,
      interviews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startMockInterview,
  submitMockInterview,
  getMockInterviews
};
