const { getModel } = require('../config/db');

const goalSchema = {
  userId: { type: String, required: true },
  goal: { type: String, required: true },
  progress: { type: Number, default: 0 }, // 0 to 100
  deadline: { type: Date, required: true },
  tasks: [{
    title: { type: String },
    completed: { type: Boolean, default: false }
  }]
};

module.exports = getModel('Goal', goalSchema);
