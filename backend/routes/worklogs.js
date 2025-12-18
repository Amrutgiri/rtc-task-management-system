const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const WorkLog = require('../models/WorkLog');
const Task = require('../models/Task');
const { authMiddleware } = require('../middleware/auth');

// @route   POST /api/worklogs
// @desc    Create a new work log
// @access  Private
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { taskId, date, durationMinutes, notes } = req.body;

    // Validate request
    if (!date || !durationMinutes) {
      return res.status(400).json({ message: 'Date and duration are required' });
    }

    // Verify task exists if taskId is provided
    if (taskId) {
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
    }

    const workLog = new WorkLog({
      userId: req.user.id,
      taskId: taskId || null,
      date: new Date(date),
      durationMinutes: Number(durationMinutes),
      notes: notes || ''
    });

    const savedLog = await workLog.save();

    // Return populated data
    const populatedLog = await WorkLog.findById(savedLog._id)
      .populate('taskId', 'title project')
      .populate('userId', 'name email');

    res.status(201).json(populatedLog);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/worklogs
// @desc    Get work logs (can filter by date range, taskId, userId) with pagination and sorting
// @access  Private
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'date',
      sortOrder = 'desc',
      search = '',
      startDate,
      endDate,
      taskId,
      userId
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    let query = {};

    // Filter by User (Admins can see all, regular users see their own unless authorized)
    // If admin and no specific userId filter, show all logs
    // If admin and has userId filter, show that user's logs
    // If regular user, show only their own logs
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    } else if (userId) {
      query.userId = userId;
    }

    // Filter by Task
    if (taskId) {
      query.taskId = taskId;
    }

    // Filter by Date Range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Execute query with population to get user and task details for search
    let logsQuery = WorkLog.find(query)
      .populate('userId', 'name email')
      .populate('taskId', 'title');

    // For search, we need to filter after population
    // First get all matching logs, then filter by search
    let allLogs = await logsQuery.lean();

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allLogs = allLogs.filter(log => {
        const userName = log.userId?.name?.toLowerCase() || '';
        const taskTitle = log.taskId?.title?.toLowerCase() || '';
        const notes = log.notes?.toLowerCase() || '';

        return userName.includes(searchLower) ||
          taskTitle.includes(searchLower) ||
          notes.includes(searchLower);
      });
    }

    const totalCount = allLogs.length;

    // Sort the filtered logs
    const sortMultiplier = sortOrder === 'asc' ? 1 : -1;
    allLogs.sort((a, b) => {
      let aVal, bVal;

      if (sortBy === 'userId') {
        aVal = a.userId?.name || '';
        bVal = b.userId?.name || '';
      } else if (sortBy === 'taskId') {
        aVal = a.taskId?.title || '';
        bVal = b.taskId?.title || '';
      } else if (sortBy === 'date') {
        aVal = new Date(a.date);
        bVal = new Date(b.date);
      } else if (sortBy === 'durationMinutes') {
        aVal = a.durationMinutes || 0;
        bVal = b.durationMinutes || 0;
      } else {
        aVal = a[sortBy] || '';
        bVal = b[sortBy] || '';
      }

      if (aVal < bVal) return -1 * sortMultiplier;
      if (aVal > bVal) return 1 * sortMultiplier;
      return 0;
    });

    // Apply pagination
    const paginatedLogs = allLogs.slice(skip, skip + parseInt(pageSize));

    res.json({
      data: paginatedLogs,
      totalCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(totalCount / parseInt(pageSize))
    });
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/worklogs/:id
// @desc    Delete a work log
// @access  Private
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const log = await WorkLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: 'Work log not found' });
    }

    // Only owner or admin can delete
    if (log.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this log' });
    }

    await log.deleteOne();
    res.json({ message: 'Work log removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
