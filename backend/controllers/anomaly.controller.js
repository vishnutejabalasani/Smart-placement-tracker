const Anomaly = require('../models/Anomaly');
const User = require('../models/User');

const getAllAnomalies = async (req, res, next) => {
  try {
    const anomalies = await Anomaly.find()
      .populate('student', 'name email profile')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: anomalies.length,
      anomalies
    });
  } catch (error) {
    next(error);
  }
};

const updateAnomalyStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const anomaly = await Anomaly.findById(id).populate('student');
    if (!anomaly) {
      return res.status(404).json({
        success: false,
        message: 'Anomaly log not found'
      });
    }

    anomaly.status = status;
    anomaly.resolvedBy = req.user.id;
    anomaly.resolvedAt = new Date();
    await anomaly.save();

    // If status is Banned and student exists, we append [BANNED] to contact for display
    if (status === 'Banned' && anomaly.student) {
      const student = await User.findById(anomaly.student._id);
      if (student) {
        student.profile.phone = `[BANNED] ${student.profile.phone}`;
        await student.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Anomaly status updated to ${status}`,
      anomaly
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAnomalies,
  updateAnomalyStatus
};
