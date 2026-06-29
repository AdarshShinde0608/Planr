const { getModel } = require('../config/db');

const taskSchema = {
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date, required: true },
  priority: { type: Number, default: 5 }, // 1-10, can be dynamically calculated
  estimatedTime: { type: Number, default: 60 }, // duration in minutes (estimatedDuration)
  actualDuration: { type: Number }, // actual time spent
  difficulty: { type: String, default: "Medium" }, // Easy, Medium, Hard
  category: { type: String, default: "Personal" }, // Work, Study, Personal, Gym, etc.
  status: { type: String, default: "pending" }, // pending, in-progress, completed
  attachments: [{ type: String }],
  subtasks: [{
    title: { type: String },
    completed: { type: Boolean, default: false }
  }],
  completedAt: { type: Date },
  scheduledStart: { type: Date, default: null },
  scheduledEnd: { type: Date, default: null },
  isScheduled: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  version: { type: Number, default: 1 },
  aiMetadata: {
    predictedPriority: { type: String },
    deadlineRisk: { type: String },
    suggestedCategory: { type: String },
    confidenceScore: { type: Number },
    recommendedStartDate: { type: Date },
    generatedByPlanner: { type: Boolean, default: false }
  }
};

module.exports = getModel('Task', taskSchema);
