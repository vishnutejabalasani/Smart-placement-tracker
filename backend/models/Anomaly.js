const mongoose = require('mongoose');

const anomalySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  type: {
    type: String,
    required: true,
    enum: ['ANOMALY_CGPA_BYPASS', 'ANOMALY_RATE_LIMIT']
  },
  payload: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['Pending', 'Warned', 'Resolved', 'Banned'],
    default: 'Pending'
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Anomaly', anomalySchema);
