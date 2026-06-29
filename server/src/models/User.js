const { getModel } = require('../config/db');

const userSchema = {
  name: { type: String, required: true },
  fullName: { type: String }, // support full name from doc
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String },
  occupation: { type: String, enum: ['Student', 'Employee', 'Freelancer', 'Entrepreneur'], default: 'Student' },
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'en' },
  onboardingCompleted: { type: Boolean, default: false },
  workHours: {
    start: { type: String, default: "09:00" },
    end: { type: String, default: "17:00" }
  },
  sleepTime: {
    start: { type: String, default: "23:00" },
    end: { type: String, default: "07:00" }
  },
  gymTime: {
    start: { type: String, default: "18:00" },
    end: { type: String, default: "19:00" }
  },
  energyPreference: { type: String, default: "Morning" }, // Morning, Afternoon, Night, Night Owl
  googleTokens: {
    access_token: String,
    refresh_token: String,
    scope: String,
    token_type: String,
    expiry_date: Number
  }
};


module.exports = getModel('User', userSchema);
