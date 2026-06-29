const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_for_planr_app_2026_saving_lives';

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword
    });

    // Create JWT Token
    const token = jwt.sign({ id: newUser._id || newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        id: newUser._id || newUser.id,
        name: newUser.name,
        email: newUser.email,
        workHours: newUser.workHours,
        sleepTime: newUser.sleepTime,
        gymTime: newUser.gymTime,
        energyPreference: newUser.energyPreference
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter all fields." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const token = jwt.sign({ id: user._id || user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        workHours: user.workHours,
        sleepTime: user.sleepTime,
        gymTime: user.gymTime,
        energyPreference: user.energyPreference
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      workHours: user.workHours,
      sleepTime: user.sleepTime,
      gymTime: user.gymTime,
      energyPreference: user.energyPreference
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Preferences (Onboarding & Settings)
exports.updatePreferences = async (req, res) => {
  try {
    const { workHours, sleepTime, gymTime, energyPreference, occupation, timezone, language } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          workHours,
          sleepTime,
          gymTime,
          energyPreference,
          occupation: occupation || 'Student',
          timezone: timezone || 'UTC',
          language: language || 'en',
          onboardingCompleted: true
        }
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found." });

    res.json({
      id: updatedUser._id || updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      workHours: updatedUser.workHours,
      sleepTime: updatedUser.sleepTime,
      gymTime: updatedUser.gymTime,
      energyPreference: updatedUser.energyPreference,
      occupation: updatedUser.occupation,
      timezone: updatedUser.timezone,
      language: updatedUser.language,
      onboardingCompleted: updatedUser.onboardingCompleted
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
