const { getModel } = require('../config/db');

const notificationSchema = {
  userId: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['Task', 'Habit', 'System'], default: 'System' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  scheduledFor: { type: Date, default: Date.now },
  delivered: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  actionUrl: { type: String }
};

module.exports = getModel('Notification', notificationSchema);
