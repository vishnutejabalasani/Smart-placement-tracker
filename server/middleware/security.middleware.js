const User = require('../models/User');
const Job = require('../models/Job');
const Anomaly = require('../models/Anomaly');
const { sendNotification } = require('../services/socket.service');

// In-memory rate limiting map for basic request spiking checks
const requestTracker = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // threshold for spike detection

/**
 * Lightweight middleware that tracks request rates and logs/flags API rate-limit spikes.
 */
const rateLimitAnomalyDetector = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  if (!requestTracker.has(ip)) {
    requestTracker.set(ip, []);
  }

  const timestamps = requestTracker.get(ip);
  const validTimestamps = timestamps.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  validTimestamps.push(now);
  requestTracker.set(ip, validTimestamps);

  if (validTimestamps.length > MAX_REQUESTS_PER_WINDOW) {
    console.warn(`[ANOMALY DETECTED] API Rate Spike: IP ${ip} made ${validTimestamps.length} requests in under 1 minute!`);
    
    // Save to database
    Anomaly.create({
      type: 'ANOMALY_RATE_LIMIT',
      payload: {
        ip,
        requestCount: validTimestamps.length,
        route: req.originalUrl,
        timestamp: new Date()
      }
    }).catch(err => console.error('Failed to log rate anomaly to DB:', err));

    sendNotification('admin', 'ANOMALY_RATE_LIMIT', {
      ip,
      requestCount: validTimestamps.length,
      route: req.originalUrl,
      timestamp: new Date()
    });

    return res.status(429).json({
      success: false,
      message: 'Anomaly Detected: Extreme request rate spike. Action blocked for system safety.'
    });
  }

  next();
};

/**
 * Middleware that flags unauthorized applications when a student bypasses frontend logic
 * and attempts to apply to a job where their CGPA is strictly below the job requirements.
 */
const cgpaEligibilityAnomalyDetector = async (req, res, next) => {
  if (req.method === 'POST' && req.originalUrl.includes('/api/applications')) {
    const studentId = req.user?.id;
    const { jobId } = req.body;

    if (!studentId || !jobId) {
      return next();
    }

    try {
      const student = await User.findById(studentId);
      const job = await Job.findById(jobId);

      if (!student || !job) {
        return next();
      }

      const studentCgpa = student.profile?.cgpa || 0.0;
      const cutoff = job.cgpaCutoff || 0.0;

      if (studentCgpa < cutoff) {
        const message = `[CGPA ANOMALY DETECTED] Student ${student.name} (${student._id}) with CGPA ${studentCgpa} attempted to apply for '${job.companyName} - ${job.role}' which requires a minimum CGPA of ${cutoff}.`;
        
        console.error(message);

        // Save to database
        Anomaly.create({
          student: studentId,
          type: 'ANOMALY_CGPA_BYPASS',
          payload: {
            studentId: student._id,
            studentName: student.name,
            studentCgpa,
            companyName: job.companyName,
            jobRole: job.role,
            requiredCgpa: cutoff,
            timestamp: new Date()
          }
        }).catch(err => console.error('Failed to log CGPA bypass anomaly to DB:', err));

        sendNotification('admin', 'ANOMALY_CGPA_BYPASS', {
          studentId: student._id,
          studentName: student.name,
          studentCgpa,
          companyName: job.companyName,
          jobRole: job.role,
          requiredCgpa: cutoff,
          timestamp: new Date()
        });

        return res.status(403).json({
          success: false,
          isAnomaly: true,
          message: `Application Rejected: Your CGPA (${studentCgpa}) does not meet the eligibility cutoff (${cutoff}) for this company. This attempt has been logged.`
        });
      }
    } catch (err) {
      console.error('Error checking CGPA cutoff in anomaly middleware:', err.message);
    }
  }
  
  next();
};

module.exports = {
  rateLimitAnomalyDetector,
  cgpaEligibilityAnomalyDetector
};
