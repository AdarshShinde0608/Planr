const { getModel } = require('../config/db');

const activityLogSchema = {
  userId: { type: String, required: true },
  action: { type: String, required: true }, // e.g. "Task Created", "Task Completed", "Habit Completed"
  entity: { type: String }, // e.g. "Task", "Habit", "Goal"
  entityId: { type: String },
  timestamp: { type: Date, default: Date.now },
  metadata: { type: Object, default: {} }
};

module.exports = getModel('ActivityLog', activityLogSchema);
