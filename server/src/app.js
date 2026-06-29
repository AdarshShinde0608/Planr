require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, isMongoConnected } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const habitRoutes = require('./routes/habitRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const goalRoutes = require('./routes/goalRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const assistantRoutes = require('./routes/assistantRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Lazy database connection middleware for serverless invocations
app.use(async (req, res, next) => {
  try {
    if (!isMongoConnected()) {
      await connectDB();
    }
  } catch (err) {
    console.error("Database connection middleware error:", err);
  }
  next();
});

// Enable CORS for frontend client
app.use(cors({
  origin: '*', // in production, set to client origin (e.g. Vercel)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/notifications', notificationRoutes);


// Simple healthcheck endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(500).json({ message: err.message || 'An internal server error occurred.' });
});

// Initialize DB and start server
// Export the Express application for Vercel serverless functions
module.exports = app;

// Start the server listener only when run directly (local development)
if (require.main === module) {
  async function startServer() {
    await connectDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Planr Backend running on port ${PORT}`);
    });
  }
  
  startServer();
}
