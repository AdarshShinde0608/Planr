const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middleware/auth');

router.get('/auth', authMiddleware, calendarController.getAuthUrl);
router.get('/auth/callback', calendarController.oauthCallback); // Public callback hit by Google
router.get('/status', authMiddleware, calendarController.getSyncStatus);

module.exports = router;
