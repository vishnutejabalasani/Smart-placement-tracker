const { applyToJob } = require('../controllers/student.controller');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const { evaluateResumeMatch } = require('../services/gemini.service');

jest.mock('../models/Application');
jest.mock('../models/Job');
jest.mock('../models/User');
jest.mock('../services/gemini.service');
jest.mock('../services/socket.service');

describe('Student Controller - applyToJob Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: { jobId: 'mock_job_id' },
      user: { id: 'mock_student_id' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  it('should block application if student already applied', async () => {
    Application.findOne.mockResolvedValue({ _id: 'existing_app_id' });

    await applyToJob(req, res, next);

    expect(Application.findOne).toHaveBeenCalledWith({
      student: 'mock_student_id',
      job: 'mock_job_id'
    });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'You have already applied or added this job to your board'
    });
  });

  it('should return 404 if job posting not found', async () => {
    Application.findOne.mockResolvedValue(null);
    Job.findById.mockResolvedValue(null);

    await applyToJob(req, res, next);

    expect(Job.findById).toHaveBeenCalledWith('mock_job_id');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Job posting not found'
    });
  });

  it('should block application if the deadline has passed', async () => {
    Application.findOne.mockResolvedValue(null);
    
    // Set a deadline in the past
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    Job.findById.mockResolvedValue({
      _id: 'mock_job_id',
      deadline: pastDate
    });

    await applyToJob(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'The application deadline for this job has passed.'
    });
  });

  it('should succeed and run AI evaluation if profile and job are valid and deadline is in the future', async () => {
    Application.findOne.mockResolvedValue(null);
    
    // Set a deadline in the future
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day in the future
    const mockJob = {
      _id: 'mock_job_id',
      companyName: 'Tech Corp',
      role: 'SDE',
      description: 'Super cool job',
      requirements: ['JavaScript'],
      cgpaCutoff: 7.5,
      deadline: futureDate
    };
    Job.findById.mockResolvedValue(mockJob);

    const mockStudent = {
      _id: 'mock_student_id',
      name: 'Test Student',
      profile: {
        branch: 'CSE',
        cgpa: 8.5,
        skills: ['JavaScript'],
        resumeText: 'Experience with JS.'
      }
    };
    User.findById.mockResolvedValue(mockStudent);

    evaluateResumeMatch.mockResolvedValue({
      matchScore: 85,
      recommendedKeywords: ['React'],
      matchFeedback: 'Good alignment'
    });

    Application.create.mockResolvedValue({
      _id: 'new_app_id',
      student: 'mock_student_id',
      job: 'mock_job_id',
      status: 'Applied',
      matchScore: 85
    });

    await applyToJob(req, res, next);

    expect(evaluateResumeMatch).toHaveBeenCalled();
    expect(Application.create).toHaveBeenCalledWith({
      student: 'mock_student_id',
      job: 'mock_job_id',
      status: 'Applied',
      matchScore: 85,
      recommendedKeywords: ['React'],
      matchFeedback: 'Good alignment'
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: 'Applied successfully. AI resume match analysis completed.'
    }));
  });
});
