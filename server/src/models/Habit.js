const { getModel } = require('../config/db');

const habitSchema = {
  userId: { type: String, required: true },
  name: { type: String, required: true },
  streak: { type: Number, default: 0 },
  history: [{
    date: { type: String }, // "YYYY-MM-DD"
    completed: { type: Boolean, default: false }
  }],
  aiMetadata: {
    bestTime: { type: String }, // e.g. "09:00"
    riskOfMissing: { type: String }, // e.g. "Low", "Medium", "High"
    recommendedReminder: { type: String }
  }
};

module.exports = getModel('Habit', habitSchema);
