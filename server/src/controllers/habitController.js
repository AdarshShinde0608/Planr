const Habit = require('../models/Habit');

// Helper to calculate current consecutive daily streak
function calculateStreak(history) {
  const completedDates = history
    .filter(h => h.completed)
    .map(h => h.date);
    
  if (completedDates.length === 0) return 0;

  // Sort unique dates newest to oldest
  const uniqueDatesSorted = [...new Set(completedDates)].sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  let checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);

  const todayStr = checkDate.toISOString().split('T')[0];
  
  // If not completed today, see if completed yesterday. If not, streak is broken (0).
  if (!uniqueDatesSorted.includes(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];
    if (!uniqueDatesSorted.includes(yesterdayStr)) {
      return 0;
    }
  }

  // Count backwards
  while (true) {
    const checkStr = checkDate.toISOString().split('T')[0];
    if (uniqueDatesSorted.includes(checkStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Get User Habits
exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user.id });
    
    // Refresh streaks on read to guarantee accuracy
    for (const habit of habits) {
      const currentStreak = calculateStreak(habit.history);
      if (habit.streak !== currentStreak) {
        await Habit.findByIdAndUpdate(habit._id || habit.id, { streak: currentStreak });
        habit.streak = currentStreak;
      }
    }
    
    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Habit
exports.createHabit = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Habit name is required." });

    const newHabit = await Habit.create({
      userId: req.user.id,
      name,
      streak: 0,
      history: []
    });

    res.status(201).json(newHabit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle Habit Completion for a Specific Date
exports.toggleHabit = async (req, res) => {
  try {
    const { date } = req.body; // YYYY-MM-DD
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
    if (!habit) return res.status(404).json({ message: "Habit not found." });

    const targetDate = date || new Date().toISOString().split('T')[0];
    const recordIndex = habit.history.findIndex(h => h.date === targetDate);

    if (recordIndex > -1) {
      // Toggle
      habit.history[recordIndex].completed = !habit.history[recordIndex].completed;
    } else {
      // Create new record
      habit.history.push({ date: targetDate, completed: true });
    }

    // Recalculate streak
    habit.streak = calculateStreak(habit.history);

    await Habit.findByIdAndUpdate(req.params.id, {
      history: habit.history,
      streak: habit.streak
    });

    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Habit
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user.id });
    if (!habit) return res.status(404).json({ message: "Habit not found." });

    await Habit.findByIdAndDelete(req.params.id);
    res.json({ message: "Habit deleted." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
