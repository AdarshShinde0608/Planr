const { google } = require('googleapis');
const Task = require('../models/Task');
const FixedSchedule = require('../models/FixedSchedule');
const User = require('../models/User');

/**
 * Creates and returns an OAuth2-authenticated Google Calendar client.
 * Listens to refreshed token events and saves them to the DB.
 */
async function getGoogleCalendarClient(user) {
  if (!user.googleTokens || !user.googleTokens.access_token) return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials(user.googleTokens);

  // Automatically persist refreshed tokens
  oauth2Client.on('tokens', async (tokens) => {
    const updatedTokens = {
      ...user.googleTokens,
      ...tokens
    };
    await User.findByIdAndUpdate(user._id || user.id, {
      $set: { googleTokens: updatedTokens }
    });
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}


/**
 * Carves out an overlapping time window from a list of free ranges.
 */
function carveTimeRange(freeRanges, carveStart, carveEnd) {
  const result = [];
  const startMs = new Date(carveStart).getTime();
  const endMs = new Date(carveEnd).getTime();

  for (const range of freeRanges) {
    const rStart = new Date(range.start).getTime();
    const rEnd = new Date(range.end).getTime();

    // 1. No overlap
    if (endMs <= rStart || startMs >= rEnd) {
      result.push(range);
    }
    // 2. Overlap: carve covers the whole range
    else if (startMs <= rStart && endMs >= rEnd) {
      // range is completely removed
    }
    // 3. Overlap: carve splits the range in two
    else if (startMs > rStart && endMs < rEnd) {
      result.push({ start: new Date(rStart), end: new Date(startMs) });
      result.push({ start: new Date(endMs), end: new Date(rEnd) });
    }
    // 4. Overlap: carve cuts off the start of the range
    else if (startMs <= rStart && endMs < rEnd) {
      result.push({ start: new Date(endMs), end: new Date(rEnd) });
    }
    // 5. Overlap: carve cuts off the end of the range
    else if (startMs > rStart && endMs >= rEnd) {
      result.push({ start: new Date(rStart), end: new Date(startMs) });
    }
  }
  return result;
}

/**
 * Converts "HH:MM" string on a target Date to a Date object.
 * Handles wrapping to next day if end time is before start time (e.g. Sleep crossing midnight).
 */
function parseTimeString(timeStr, referenceDate, nextDay = false) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const target = new Date(referenceDate);
  target.setHours(hours, minutes, 0, 0);
  if (nextDay) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

/**
 * Calculates priority score for sorting tasks.
 * Formula: Priority = BasePriority (1-10) + DeadlineUrgency (0-5) + DifficultyModifier
 */
function calculatePriorityScore(task, now) {
  let score = task.priority || 5;

  // Deadline Urgency: closer deadlines increase priority
  const msToDeadline = new Date(task.deadline).getTime() - now.getTime();
  const hoursToDeadline = msToDeadline / (1000 * 60 * 60);

  if (hoursToDeadline > 0) {
    if (hoursToDeadline <= 4) {
      score += 5; // Extreme urgency
    } else if (hoursToDeadline <= 12) {
      score += 4;
    } else if (hoursToDeadline <= 24) {
      score += 3;
    } else if (hoursToDeadline <= 48) {
      score += 1.5;
    }
  } else {
    score += 6; // Overdue tasks get boosted
  }

  // Difficulty adjustment: Hard tasks get scheduled earlier if possible
  if (task.difficulty === "Hard") {
    score += 1.5;
  } else if (task.difficulty === "Easy") {
    score -= 1.0;
  }

  return score;
}

/**
 * Main Dynamic Scheduling Algorithm
 */
async function generateSchedule(userId, baseDate = new Date(), fromCurrentTime = false) {
  const now = new Date();
  
  // Define scheduling start and end window
  const startOfDay = new Date(baseDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);

  // If scheduling from "now" (rescheduling during the day), start window at current time
  const scheduleStart = fromCurrentTime && now.getTime() > startOfDay.getTime() && now.getTime() < endOfDay.getTime()
    ? now
    : startOfDay;

  let freeRanges = [{ start: scheduleStart, end: endOfDay }];

  // 1. Fetch User Profile for base routines
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const fixedBlocks = [];

  // Helper to safely add routine blocks to the scheduling grid
  const addRoutineBlock = (label, routine) => {
    if (!routine || !routine.start || !routine.end) return;

    let start = parseTimeString(routine.start, startOfDay);
    let end = parseTimeString(routine.end, startOfDay);

    // Handle wrap-around (e.g. sleep 23:00 to 07:00)
    if (end.getTime() < start.getTime()) {
      // If scheduleStart is in the evening, the sleep ends tomorrow
      if (scheduleStart.getHours() >= 12) {
        end = parseTimeString(routine.end, startOfDay, true);
      } else {
        // If scheduleStart is early morning, sleep started yesterday
        start = parseTimeString(routine.start, startOfDay);
        start.setDate(start.getDate() - 1);
      }
    }

    // Only add if it overlaps with our schedule window
    if (end.getTime() > scheduleStart.getTime() && start.getTime() < endOfDay.getTime()) {
      fixedBlocks.push({
        type: "fixed",
        title: label,
        start,
        end,
        category: label === "Sleep" ? "Sleep" : "Gym"
      });
    }
  };

  // Add standard user routine blocks
  addRoutineBlock("Sleep", user.sleepTime);
  addRoutineBlock("Work/Study", user.workHours);
  addRoutineBlock("Gym Routine", user.gymTime);

  // 2. Fetch custom Fixed Schedule items for this day of week
  const dayOfWeek = scheduleStart.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const customFixed = await FixedSchedule.find({ userId });
  
  for (const item of customFixed) {
    if (item.repeatDays.includes(dayOfWeek)) {
      const start = parseTimeString(item.startTime, startOfDay);
      const end = parseTimeString(item.endTime, startOfDay);

      if (end.getTime() > scheduleStart.getTime() && start.getTime() < endOfDay.getTime()) {
        fixedBlocks.push({
          type: "fixed",
          title: item.activity,
          start,
          end,
          category: "Fixed Commitment"
        });
      }
    }
  }

  // 2b. Fetch Google Calendar events for the target date
  try {
    const calendar = await getGoogleCalendarClient(user);
    if (calendar) {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });
      const events = response.data.items || [];
      for (const event of events) {
        if (event.start && event.start.dateTime && event.end && event.end.dateTime) {
          const start = new Date(event.start.dateTime);
          const end = new Date(event.end.dateTime);

          if (end.getTime() > scheduleStart.getTime() && start.getTime() < endOfDay.getTime()) {
            fixedBlocks.push({
              type: "fixed",
              title: `Google Calendar: ${event.summary || 'Busy'}`,
              start,
              end,
              category: "Google Calendar"
            });
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch Google Calendar events:", err.message);
  }

  // 3. Carve all fixed blocks from the free time ranges
  for (const block of fixedBlocks) {
    freeRanges = carveTimeRange(freeRanges, block.start, block.end);
  }


  // 4. Fetch all pending tasks for this user
  // (Filter tasks that have a deadline today or are overdue)
  const pendingTasks = await Task.find({
    userId,
    status: "pending"
  });

  // Calculate dynamic priorities and sort
  const tasksWithScores = pendingTasks.map(task => ({
    task,
    score: calculatePriorityScore(task, scheduleStart)
  })).sort((a, b) => b.score - a.score);

  const scheduledTasks = [];

  // 5. Place tasks in remaining free ranges
  for (const item of tasksWithScores) {
    const task = item.task;
    const durationMs = task.estimatedTime * 60 * 1000; // convert minutes to ms

    let placed = false;

    // Check energy matching preferences
    // Early birds prefer complex tasks in the morning, night owls in the evening
    const preferMorning = user.energyPreference === "Morning";
    const preferEvening = user.energyPreference === "Night" || user.energyPreference === "Night Owl";

    // Re-order free ranges temporarily to try matching energy slots first
    let sortedFreeRanges = [...freeRanges];
    if (task.difficulty === "Hard" || task.category === "Work" || task.category === "Study") {
      sortedFreeRanges.sort((a, b) => {
        const aStartHour = a.start.getHours();
        const bStartHour = b.start.getHours();

        if (preferMorning) {
          // Prefer earlier start hours
          return aStartHour - bStartHour;
        } else if (preferEvening) {
          // Prefer later start hours (afternoon/evening)
          return bStartHour - aStartHour;
        }
        return 0;
      });
    }

    for (const range of sortedFreeRanges) {
      const rangeDuration = range.end.getTime() - range.start.getTime();

      if (rangeDuration >= durationMs) {
        // Fit task at the start of this free range
        const taskStart = new Date(range.start);
        const taskEnd = new Date(taskStart.getTime() + durationMs);

        // Ensure task doesn't exceed its deadline or end of today
        if (taskEnd.getTime() <= new Date(task.deadline).getTime() && taskEnd.getTime() <= endOfDay.getTime()) {
          // Place task!
          scheduledTasks.push({
            type: "task",
            taskId: task._id || task.id,
            title: task.title,
            start: taskStart,
            end: taskEnd,
            category: task.category,
            difficulty: task.difficulty,
            priority: task.priority
          });

          // Save back to DB
          await Task.findByIdAndUpdate(task._id || task.id, {
            scheduledStart: taskStart,
            scheduledEnd: taskEnd,
            isScheduled: true
          });

          // Carve out task slot from free ranges
          // Adding a 15-minute buffer after the task for rest/breaks (Productivity Coach USP)
          const bufferMs = 15 * 60 * 1000;
          const carveEnd = new Date(taskEnd.getTime() + bufferMs);
          freeRanges = carveTimeRange(freeRanges, taskStart, carveEnd < range.end ? carveEnd : range.end);
          placed = true;
          break;
        }
      }
    }

    // If task couldn't be scheduled, mark it as unscheduled
    if (!placed) {
      await Task.findByIdAndUpdate(task._id || task.id, {
        scheduledStart: null,
        scheduledEnd: null,
        isScheduled: false
      });
    }
  }

  // Combine fixed blocks and task blocks, sort chronologically
  const fullTimeline = [...fixedBlocks, ...scheduledTasks].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  return fullTimeline;
}

module.exports = {
  generateSchedule
};
