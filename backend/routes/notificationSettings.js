const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const NotificationSettings = require('../models/NotificationSettings');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

/* ---------------------------------------------------------
   GET USER'S NOTIFICATION SETTINGS
--------------------------------------------------------- */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    let settings = await NotificationSettings.findOne({ userId: req.user.id })
      .populate('mutedProjects', 'name')
      .populate('mutedTasks', 'title')
      .populate('mutedUsers', 'name email');

    // Create default settings if doesn't exist
    if (!settings) {
      settings = await NotificationSettings.create({
        userId: req.user.id,
      });
    }

    res.json(settings);
  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------------------
   UPDATE NOTIFICATION SETTINGS
--------------------------------------------------------- */
router.patch(
  '/',
  authMiddleware,
  [
    body('emailNotifications').optional().isBoolean(),
    body('pushNotifications').optional().isBoolean(),
    body('soundAlerts').optional().isBoolean(),
    body('frequency').optional().isIn(['immediate', 'daily', 'never']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        emailNotifications,
        pushNotifications,
        soundAlerts,
        frequency,
        quietHours,
        notificationTypes,
      } = req.body;

      let settings = await NotificationSettings.findOne({ userId: req.user.id });

      if (!settings) {
        settings = await NotificationSettings.create({
          userId: req.user.id,
        });
      }

      // Update fields if provided
      if (emailNotifications !== undefined) settings.emailNotifications = emailNotifications;
      if (pushNotifications !== undefined) settings.pushNotifications = pushNotifications;
      if (soundAlerts !== undefined) settings.soundAlerts = soundAlerts;
      if (frequency !== undefined) settings.frequency = frequency;
      if (quietHours !== undefined) settings.quietHours = quietHours;
      if (notificationTypes !== undefined) settings.notificationTypes = notificationTypes;

      await settings.save();

      res.json(settings);
    } catch (err) {
      next(err);
    }
  }
);

/* ---------------------------------------------------------
   MUTE/UNMUTE A PROJECT
--------------------------------------------------------- */
router.post('/mute-project/:projectId', authMiddleware, async (req, res, next) => {
  try {
    let settings = await NotificationSettings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = await NotificationSettings.create({
        userId: req.user.id,
      });
    }

    const { projectId } = req.params;
    const isMuted = settings.mutedProjects.includes(projectId);

    if (isMuted) {
      settings.mutedProjects = settings.mutedProjects.filter(
        (id) => id.toString() !== projectId
      );
    } else {
      settings.mutedProjects.push(projectId);
    }

    await settings.save();
    await settings.populate('mutedProjects', 'name');

    res.json({
      success: true,
      muted: !isMuted,
      mutedProjects: settings.mutedProjects,
    });
  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------------------
   MUTE/UNMUTE A TASK
--------------------------------------------------------- */
router.post('/mute-task/:taskId', authMiddleware, async (req, res, next) => {
  try {
    let settings = await NotificationSettings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = await NotificationSettings.create({
        userId: req.user.id,
      });
    }

    const { taskId } = req.params;
    const isMuted = settings.mutedTasks.includes(taskId);

    if (isMuted) {
      settings.mutedTasks = settings.mutedTasks.filter(
        (id) => id.toString() !== taskId
      );
    } else {
      settings.mutedTasks.push(taskId);
    }

    await settings.save();
    await settings.populate('mutedTasks', 'title');

    res.json({
      success: true,
      muted: !isMuted,
      mutedTasks: settings.mutedTasks,
    });
  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------------------
   MUTE/UNMUTE A USER
--------------------------------------------------------- */
router.post('/mute-user/:userId', authMiddleware, async (req, res, next) => {
  try {
    let settings = await NotificationSettings.findOne({ userId: req.user.id });

    if (!settings) {
      settings = await NotificationSettings.create({
        userId: req.user.id,
      });
    }

    const { userId } = req.params;
    const isMuted = settings.mutedUsers.includes(userId);

    if (isMuted) {
      settings.mutedUsers = settings.mutedUsers.filter(
        (id) => id.toString() !== userId
      );
    } else {
      settings.mutedUsers.push(userId);
    }

    await settings.save();
    await settings.populate('mutedUsers', 'name email');

    res.json({
      success: true,
      muted: !isMuted,
      mutedUsers: settings.mutedUsers,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
