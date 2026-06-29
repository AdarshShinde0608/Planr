const { getModel } = require('../config/db');

const aiProfileSchema = {
  userId: { type: String, required: true, unique: true },
  preferredFocusHours: [{ type: Number }], // array of preferred hours of day (0-23)
  averageTaskDuration: { type: Number, default: 60 }, // minutes
  averageDelay: { type: Number, default: 0 }, // minutes
  reminderResponseRate: { type: Number, default: 1.0 }, // 0 to 1
  preferredSessionLength: { type: Number, default: 45 }, // minutes
  preferredBreakLength: { type: Number, default: 15 }, // minutes
  habitConsistency: { type: Number, default: 1.0 }, // 0 to 1
  aiConfidence: { type: Number, default: 0.9 }
};

module.exports = getModel('AIProfile', aiProfileSchema);
