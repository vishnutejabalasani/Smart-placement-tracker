const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required'],
  },
  status: {
    type: String,
    enum: ['Wishlist', 'Applied', 'OA', 'Interview', 'Offered', 'Rejected'],
    default: 'Wishlist',
  },
  matchScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  recommendedKeywords: {
    type: [String],
    default: [],
  },
  matchFeedback: {
    type: String,
    default: '',
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Ensure a student can only apply to a job once (single active application path)
applicationSchema.index({ student: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
