const { getModel } = require('../config/db');

const fixedScheduleSchema = {
  userId: { type: String, required: true },
  activity: { type: String, required: true }, // e.g. "Work", "College", "Commute", "Meals", "Gym", "Sleep"
  startTime: { type: String, required: true }, // "HH:MM" e.g., "09:00"
  endTime: { type: String, required: true }, // "HH:MM" e.g., "17:00"
  repeatDays: [{ type: Number }] // Array of days: 0 (Sunday) to 6 (Saturday)
};

module.exports = getModel('FixedSchedule', fixedScheduleSchema);
