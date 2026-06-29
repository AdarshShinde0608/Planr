const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', habitController.getHabits);
router.post('/', habitController.createHabit);
router.put('/:id/toggle', habitController.toggleHabit);
router.delete('/:id', habitController.deleteHabit);

module.exports = router;
