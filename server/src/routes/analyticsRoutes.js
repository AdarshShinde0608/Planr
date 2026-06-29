const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', analyticsController.getAnalytics);
router.get('/history', analyticsController.getAnalyticsHistory);

module.exports = router;
