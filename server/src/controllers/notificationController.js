const Notification = require('../models/Notification');

// Get all notifications for logged-in user
exports.getNotifications = async (req, res) => {
  try {
    let notifications = await Notification.find({ userId: req.user.id });
    // Sort in descending order of scheduledFor
    notifications.sort((a, b) => new Date(b.scheduledFor) - new Date(a.scheduledFor));
    // Limit to 50
    notifications = notifications.slice(0, 50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!notification) {
      return res.status(404).json({ message: "Notification not found." });
    }
    res.json({ message: "Notification deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
