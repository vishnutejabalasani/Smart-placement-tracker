const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  role: {
    type: String,
    required: [true, 'Role title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Job description is required'],
  },
  requirements: {
    type: [String],
    default: [],
  },
  cgpaCutoff: {
    type: Number,
    required: [true, 'CGPA cutoff is required'],
    default: 0.0,
    min: 0,
    max: 10,
  },
  eligibleBranches: {
    type: [String],
    default: [], // e.g., ['CSE', 'ECE', 'EE'] - empty implies all branches eligible
  },
  deadline: {
    type: Date,
    required: [true, 'Application deadline is required'],
  },
  package: {
    type: Number, // in LPA (Lakhs Per Annum)
    required: [true, 'Salary package (LPA) is required'],
    default: 0.0,
  },
  active: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
