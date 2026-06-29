const Goal = require('../models/Goal');

// Get User Goals
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user.id });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Goal
exports.createGoal = async (req, res) => {
  try {
    const { goal, deadline, tasks } = req.body;

    if (!goal || !deadline) {
      return res.status(400).json({ message: "Goal title and deadline are required." });
    }

    const newGoal = await Goal.create({
      userId: req.user.id,
      goal,
      deadline: new Date(deadline),
      progress: 0,
      tasks: tasks || []
    });

    res.status(201).json(newGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Goal / Toggle Subtasks
exports.updateGoal = async (req, res) => {
  try {
    const { goal: title, deadline, tasks } = req.body;
    const existingGoal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!existingGoal) return res.status(404).json({ message: "Goal not found." });

    const updates = {};
    if (title) updates.goal = title;
    if (deadline) updates.deadline = new Date(deadline);
    
    if (tasks) {
      updates.tasks = tasks;
      // Calculate progress percentage
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.completed).length;
      updates.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    }

    const updatedGoal = await Goal.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );

    res.json(updatedGoal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Goal
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user.id });
    if (!goal) return res.status(404).json({ message: "Goal not found." });

    await Goal.findByIdAndDelete(req.params.id);
    res.json({ message: "Goal deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
