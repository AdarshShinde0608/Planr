const schedulerService = require('../services/schedulerService');
const FixedSchedule = require('../models/FixedSchedule');

// Generate Daily Schedule
exports.generateSchedule = async (req, res) => {
  try {
    const { targetDate } = req.body;
    const baseDate = targetDate ? new Date(targetDate) : new Date();
    
    const timeline = await schedulerService.generateSchedule(req.user.id, baseDate, false);
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reschedule Remaining Tasks Dynamically (from current time)
exports.reschedule = async (req, res) => {
  try {
    const { targetDate } = req.body;
    const baseDate = targetDate ? new Date(targetDate) : new Date();

    const timeline = await schedulerService.generateSchedule(req.user.id, baseDate, true);
    res.json(timeline);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Fixed commitments
exports.getFixedCommitments = async (req, res) => {
  try {
    const commitments = await FixedSchedule.find({ userId: req.user.id });
    res.json(commitments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Fixed commitment
exports.addFixedCommitment = async (req, res) => {
  try {
    const { activity, startTime, endTime, repeatDays } = req.body;

    if (!activity || !startTime || !endTime || !repeatDays) {
      return res.status(400).json({ message: "Please provide activity, startTime, endTime, and repeatDays." });
    }

    const newCommitment = await FixedSchedule.create({
      userId: req.user.id,
      activity,
      startTime,
      endTime,
      repeatDays
    });

    res.status(201).json(newCommitment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Fixed commitment
exports.deleteFixedCommitment = async (req, res) => {
  try {
    const commitment = await FixedSchedule.findOne({ _id: req.params.id, userId: req.user.id });
    if (!commitment) return res.status(404).json({ message: "Commitment not found." });

    await FixedSchedule.findByIdAndDelete(req.params.id);
    res.json({ message: "Fixed commitment deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
