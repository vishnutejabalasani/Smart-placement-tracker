const Job = require('../models/Job');

/**
 * Create a new job posting (Admin only)
 */
const createJob = async (req, res, next) => {
  try {
    const { companyName, role, description, requirements, cgpaCutoff, eligibleBranches, deadline, package } = req.body;

    const job = await Job.create({
      companyName,
      role,
      description,
      requirements: Array.isArray(requirements) ? requirements : requirements?.split(',').map(r => r.trim()) || [],
      cgpaCutoff: Number(cgpaCutoff),
      eligibleBranches: Array.isArray(eligibleBranches) ? eligibleBranches : eligibleBranches?.split(',').map(b => b.trim()) || [],
      deadline,
      package: Number(package)
    });

    return res.status(201).json({
      success: true,
      message: 'Job posting created successfully',
      job
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch all job postings with advanced filters (Student Feed / Admin list)
 */
const getAllJobs = async (req, res, next) => {
  try {
    const { branch, maxCgpa, search } = req.query;
    const filter = { active: true };

    if (branch) {
      filter.eligibleBranches = { $in: [new RegExp(branch, 'i'), []] }; 
    }

    if (maxCgpa) {
      filter.cgpaCutoff = { $lte: Number(maxCgpa) };
    }

    if (search) {
      filter.$or = [
        { companyName: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } }
      ];
    }

    const jobs = await Job.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch detailed view of a single job
 */
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    return res.status(200).json({
      success: true,
      job
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an existing job posting (Admin only)
 */
const updateJob = async (req, res, next) => {
  try {
    const { companyName, role, description, requirements, cgpaCutoff, eligibleBranches, deadline, package, active } = req.body;

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    job.companyName = companyName !== undefined ? companyName : job.companyName;
    job.role = role !== undefined ? role : job.role;
    job.description = description !== undefined ? description : job.description;
    job.cgpaCutoff = cgpaCutoff !== undefined ? Number(cgpaCutoff) : job.cgpaCutoff;
    job.package = package !== undefined ? Number(package) : job.package;
    job.deadline = deadline !== undefined ? deadline : job.deadline;
    job.active = active !== undefined ? active : job.active;

    if (requirements !== undefined) {
      job.requirements = Array.isArray(requirements) ? requirements : requirements.split(',').map(r => r.trim());
    }

    if (eligibleBranches !== undefined) {
      job.eligibleBranches = Array.isArray(eligibleBranches) ? eligibleBranches : eligibleBranches.split(',').map(b => b.trim());
    }

    await job.save();

    return res.status(200).json({
      success: true,
      message: 'Job posting updated successfully',
      job
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a job posting (Admin only)
 */
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job posting deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob
};
