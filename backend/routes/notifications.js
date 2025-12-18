const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { authMiddleware } = require("../middleware/auth");
const Task = require("../models/Task");
const Project = require("../models/Project");

/* ----------------------------------------------------
   GET Notifications with pagination
   Query: ?page=1&limit=20&read=false
---------------------------------------------------- */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const read = req.query.read; // undefined, 'true', or 'false'

    const skip = (page - 1) * limit;

    // Build filter
    let filter = { userId: req.user._id };
    if (read !== undefined) {
      filter.read = read === 'true';
    }

    // Get total count
    const total = await Notification.countDocuments(filter);

    // Get paginated notifications with populated task/project/sender data
    const notifications = await Notification.find(filter)
      .populate('meta.taskId', 'title projectId')
      .populate('senderId', 'name avatar')
      .populate('meta.projectId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Enrich notifications with icons
    const enrichedNotifications = await Promise.all(
      notifications.map(async (notif) => {
        let icon = 'bi-bell';
        let type = 'notification';

        if (notif.meta?.taskId) {
          icon = 'bi-check2-square';
          type = 'task';
        } else if (notif.meta?.projectId) {
          icon = 'bi-folder';
          type = 'project';
        }

        return {
          ...notif,
          icon,
          type,
        };
      })
    );

    res.json({
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      notifications: enrichedNotifications,
    });
  } catch (err) {
    next(err);
  }
});

/* ----------------------------------------------------
   Mark ALL notifications as read (MUST BE BEFORE /:id/read)
---------------------------------------------------- */
router.patch("/mark-all/read", authMiddleware, async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );
    res.json({ success: true, modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
});

/* ----------------------------------------------------
   Mark specific notification as read
---------------------------------------------------- */
router.patch("/:id/read", authMiddleware, async (req, res, next) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    res.json(n);
  } catch (err) {
    next(err);
  }
});

/* ----------------------------------------------------
   Delete a notification
---------------------------------------------------- */
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const notif = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notif) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ----------------------------------------------------
   Get unread count
---------------------------------------------------- */
router.get("/count/unread", authMiddleware, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      read: false,
    });
    res.json({ unreadCount: count });
  } catch (err) {
    next(err);
  }
});

/* ----------------------------------------------------
   Admin Broadcast Notification to a User
   Includes sound alert trigger
---------------------------------------------------- */
router.post("/", authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admin only" });

    const { userId, title, body, meta, playSoundAlert } = req.body;

    if (!userId || !title)
      return res.status(400).json({ message: "userId & title required" });

    const notif = await Notification.send(userId, {
      title,
      body,
      meta,
      playSoundAlert: playSoundAlert !== false, // default true
      senderId: req.user._id,
    });

    res.json(notif);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
