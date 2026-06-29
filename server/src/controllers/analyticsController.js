const Task = require('../models/Task');
const Habit = require('../models/Habit');
const aiService = require('../services/aiService');

// Get Productivity Insights & Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await Task.find({ userId });
    const habits = await Habit.find({ userId });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const completedCount = completedTasks.length;

    // 1. Calculate Completion Rate
    const completionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    // 2. Calculate Productivity Score (0-100)
    // Formula: weights completion rate (70%) and completing high-priority tasks (30%)
    let priorityBonus = 0;
    if (completedCount > 0) {
      const avgCompletedPriority = completedTasks.reduce((sum, t) => sum + (t.priority || 5), 0) / completedCount;
      priorityBonus = (avgCompletedPriority / 10) * 30; // Max 30 points
    }
    const productivityScore = Math.min(100, Math.round((completionRate * 0.7) + priorityBonus));

    // 3. Category Distribution
    const categoryDistribution = {};
    tasks.forEach(t => {
      const cat = t.category || 'Personal';
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });

    // 4. Overdue Tasks count
    const now = new Date();
    const overdueCount = pendingTasks.filter(t => new Date(t.deadline).getTime() < now.getTime()).length;

    // 5. Generate AI Daily Reflection / Coach Suggestion
    const reflectionText = await aiService.generateReflection(completedTasks, pendingTasks);

    res.json({
      productivityScore,
      completionRate,
      totalTasks,
      completedCount,
      pendingCount: pendingTasks.length,
      overdueCount,
      categoryDistribution,
      reflection: reflectionText
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Productivity History over last 7 days
exports.getAnalyticsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const tasks = await Task.find({ userId });

    const history = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Filter tasks due or completed on this specific date
      const tasksOnDay = tasks.filter(t => {
        const tDate = new Date(t.deadline || t.updatedAt).toISOString().split('T')[0];
        return tDate === dateStr;
      });

      const completedOnDay = tasksOnDay.filter(t => t.status === 'completed');
      
      const total = tasksOnDay.length;
      const completed = completedOnDay.length;
      
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      // Calculate daily score
      let score = completionRate;
      if (completed > 0) {
        const avgPriority = completedOnDay.reduce((sum, t) => sum + (t.priority || 5), 0) / completed;
        score = Math.min(100, Math.round((completionRate * 0.8) + (avgPriority * 2))); // Weight priority
      } else {
        // Default base score for days without tasks to look nice
        score = total === 0 ? 50 : 0; 
      }

      // Format date label (e.g. "Jun 28")
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      history.push({
        date: dateStr,
        label,
        totalTasks: total,
        completedTasks: completed,
        completionRate,
        productivityScore: score
      });
    }

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

