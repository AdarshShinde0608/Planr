const aiService = require('../services/aiService');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const schedulerService = require('../services/schedulerService');

// POST /assistant/chat
exports.chat = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: "Please provide a chat message." });
    }

    // 1. Load User Context
    const user = await User.findById(userId);
    const tasks = await Task.find({ userId, status: { $ne: 'completed' } });
    const habits = await Habit.find({ userId });
    
    // Get today's generated timeline (on-the-fly or default)
    let schedule = [];
    try {
      schedule = await schedulerService.generateSchedule(userId, new Date(), false);
    } catch (e) {
      console.warn("Scheduler context fetch failed:", e.message);
    }

    const context = { user, tasks, schedule, habits };

    // 2. Chat with AI Assistant
    const aiResponse = await aiService.chatWithAssistant(message, context);

    // 3. Log user activity
    await ActivityLog.create({
      userId,
      action: "Assistant Chat Request",
      entity: "AI Assistant",
      metadata: { message, responseMessage: aiResponse.message, actionsGenerated: aiResponse.actions }
    });

    res.json({
      success: true,
      message: aiResponse.message,
      actions: aiResponse.actions || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /assistant/actions
exports.getSuggestedActions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const tasks = await Task.find({ userId, status: 'pending' });
    const habits = await Habit.find({ userId });
    
    const actions = [];
    
    // 1. Suggest rescheduling if tasks are overdue
    const now = new Date();
    const overdueTasks = tasks.filter(t => new Date(t.deadline).getTime() < now.getTime());
    if (overdueTasks.length > 0) {
      actions.push({
        type: "RESCHEDULE",
        description: `Optimize schedule (You have ${overdueTasks.length} overdue task(s))`
      });
    }

    // 2. Suggest focusing on highest priority task
    const highestPriorityTask = tasks.sort((a, b) => b.priority - a.priority)[0];
    if (highestPriorityTask) {
      actions.push({
        type: "FOCUS_TASK",
        taskId: highestPriorityTask._id || highestPriorityTask.id,
        description: `Work on "${highestPriorityTask.title}" (Priority ${highestPriorityTask.priority})`
      });
    }

    // 3. Suggest completing an outstanding habit for today
    const todayStr = now.toISOString().split('T')[0];
    const uncompletedHabit = habits.find(h => {
      const todayRecord = h.history.find(r => r.date === todayStr);
      return !todayRecord || !todayRecord.completed;
    });
    if (uncompletedHabit) {
      actions.push({
        type: "VIEW_PAGE",
        page: "/habits",
        description: `Complete habit: "${uncompletedHabit.name}"`
      });
    }

    // Default fallback action
    if (actions.length === 0) {
      actions.push({
        type: "VIEW_PAGE",
        page: "/tasks",
        description: "Review task backlog"
      });
    }

    res.json(actions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
