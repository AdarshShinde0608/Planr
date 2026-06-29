const Task = require('../models/Task');
const aiService = require('../services/aiService');

// Create Task (with optional AI Extraction)
exports.createTask = async (req, res) => {
  try {
    const { rawText, deadline, ...directFields } = req.body;
    const userId = req.user.id;

    let taskData = { userId };

    if (rawText) {
      // Analyze task with LLM or heuristic fallback
      const aiAnalysis = await aiService.analyzeTask(rawText, deadline);
      taskData = {
        ...taskData,
        title: aiAnalysis.title,
        category: aiAnalysis.category,
        difficulty: aiAnalysis.difficulty,
        estimatedTime: aiAnalysis.estimatedTime,
        priority: aiAnalysis.priority,
        subtasks: aiAnalysis.subtasks,
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 24 * 60 * 60 * 1000) // Default: 24h from now
      };
    } else {
      taskData = {
        ...taskData,
        ...directFields,
        deadline: deadline ? new Date(deadline) : new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    }

    const newTask = await Task.create(taskData);
    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found." });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found." });

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found." });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
