const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/generate', scheduleController.generateSchedule);
router.post('/reschedule', scheduleController.reschedule);
router.get('/fixed', scheduleController.getFixedCommitments);
router.post('/fixed', scheduleController.addFixedCommitment);
router.delete('/fixed/:id', scheduleController.deleteFixedCommitment);

module.exports = router;
