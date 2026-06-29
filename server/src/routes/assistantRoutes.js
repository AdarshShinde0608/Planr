const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/chat', assistantController.chat);
router.get('/actions', assistantController.getSuggestedActions);

module.exports = router;
