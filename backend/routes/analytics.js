const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const WorkLog = require('../models/WorkLog');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/analytics/summary
// @desc    Get high-level statistics
// @access  Private
router.get('/summary', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Base query: Admin sees ALL, Others see assigned/created/unassigned?
    // User requested "Admin Dashboard", so we assume Admin View.
    // If we want consistency, Admin sees everything.
    const taskQuery = isAdmin ? {} : {
      $or: [
        { assigneeId: userId },
        { assigneeId: null },
        { createdBy: userId }
      ]
    };

    // Parallelize queries for performance
    const [
      totalTasks,
      completedTasks,
      totalProjects,
      recentWorkLogs,
      statusCounts, // For Pie Chart
      priorityCounts, // For Bar Chart
      projectCounts // For Bar Chart
    ] = await Promise.all([
      Task.countDocuments(taskQuery),
      Task.countDocuments({ ...taskQuery, status: 'completed' }),
      Project.countDocuments(isAdmin ? {} : { members: userId }),
      WorkLog.find(isAdmin ? {} : { userId }).sort({ date: -1 }).limit(5).populate('taskId', 'title').populate('userId', 'name'),

      // Aggregations
      Task.aggregate([
        { $match: taskQuery },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: taskQuery },
        { $group: { _id: "$priority", count: { $sum: 1 } } }
      ]),
      Task.aggregate([
        { $match: taskQuery },
        { $group: { _id: "$projectId", count: { $sum: 1 } } },
        { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "project" } },
        { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } }, // Keep tasks with no project
        { $project: { name: { $ifNull: ["$project.name", "No Project"] }, count: 1 } }
      ])
    ]);

    // Format aggregations for frontend
    const tasksByStatus = statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const tasksByPriority = priorityCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Calculate generic "productivity score" (just % completed for now)
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      totalTasks,
      completedTasks,
      openTasks: totalTasks - completedTasks,
      totalProjects,
      completionRate,
      recentActivity: recentWorkLogs, // Ensure this populates correctly
      charts: {
        tasksByStatus,
        tasksByPriority,
        tasksByProject: projectCounts
      }
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/analytics/productivity
// @desc    Get tasks completion trend (last 7 days)
// @access  Private
router.get('/productivity', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const matchQuery = isAdmin ? {} : { assigneeId: mongoose.Types.ObjectId(userId) };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Aggregate tasks by date (using createdAt for simplicity, or updatedAt if status is completed)
    // Actually, 'taskDate' is a better metric for "Due" tasks, but for productivity we want "Completed"
    // Since we don't store "completedAt", we'll use "updatedAt" for completed tasks.

    const data = await Task.aggregate([
      {
        $match: {
          ...matchQuery,
          status: 'completed',
          updatedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/analytics/work-stats
// @desc    Get total hours logged summary
// @access  Private
router.get('/work-stats', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user._id; // Use _id instead of id

    // Get total minutes logged by this user ever
    const aggregation = await WorkLog.aggregate([
      { $match: { userId: userId } }, // userId is already an ObjectId
      { $group: { _id: null, totalMinutes: { $sum: "$durationMinutes" } } }
    ]);

    const totalMinutes = aggregation.length > 0 ? aggregation[0].totalMinutes : 0;
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    res.json({
      totalMinutes,
      totalHours
    });
  } catch (err) {
    next(err);
  }
});

// NEW: Helper function for date ranges
function getDateRange(startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();
  return { start, end };
}

// ==================== WORK LOG ANALYTICS (NEW) ====================

// GET /analytics/worklogs/summary - Comprehensive work log summary
router.get('/worklogs/summary', authMiddleware, async (req, res, next) => {
  try {
    const { startDate, endDate, userId, projectId } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const query = { date: { $gte: start, $lte: end } };

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    // Aggregate by user
    const byUser = await WorkLog.aggregate([
      { $match: query },
      { $group: { _id: "$userId", totalMinutes: { $sum: "$durationMinutes" }, count: { $sum: 1 } } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { userId: "$_id", userName: "$user.name", userEmail: "$user.email", totalHours: { $divide: ["$totalMinutes", 60] }, totalMinutes: 1, count: 1 } },
      { $sort: { totalMinutes: -1 } }
    ]);

    // Aggregate by project
    const byProject = await WorkLog.aggregate([
      { $match: { ...query, taskId: { $ne: null } } },
      { $lookup: { from: "tasks", localField: "taskId", foreignField: "_id", as: "task" } },
      { $unwind: "$task" },
      { $group: { _id: "$task.projectId", totalMinutes: { $sum: "$durationMinutes" }, count: { $sum: 1 } } },
      { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "project" } },
      { $unwind: "$project" },
      { $project: { projectId: "$_id", projectName: "$project.name", totalHours: { $divide: ["$totalMinutes", 60] }, totalMinutes: 1, count: 1 } },
      { $sort: { totalMinutes: -1 } }
    ]);

    // Total
    const totalResult = await WorkLog.aggregate([
      { $match: query },
      { $group: { _id: null, totalMinutes: { $sum: "$durationMinutes" }, totalLogs: { $sum: 1 } } }
    ]);
    const total = totalResult[0] || { totalMinutes: 0, totalLogs: 0 };

    res.json({
      summary: { totalHours: total.totalMinutes / 60, totalMinutes: total.totalMinutes, totalLogs: total.totalLogs, dateRange: { start, end } },
      byUser,
      byProject
    });
  } catch (err) {
    next(err);
  }
});

// GET /analytics/worklogs/trends - Daily work log trends
router.get('/worklogs/trends', authMiddleware, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const query = { date: { $gte: start, $lte: end } };
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      query.userId = req.user._id;
    }

    const result = await WorkLog.aggregate([
      { $match: query },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, totalMinutes: { $sum: "$durationMinutes" }, logCount: { $sum: 1 } } },
      { $project: { date: "$_id", totalHours: { $divide: ["$totalMinutes", 60] }, totalMinutes: 1, logCount: 1 } },
      { $sort: { date: 1 } }
    ]);

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ==================== PROJECT ANALYTICS (NEW) ====================

// GET /analytics/projects/progress - Project progress metrics
router.get('/projects/progress', authMiddleware, async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const projectQuery = projectId ? { _id: projectId } : {};
    const projects = await Project.find(projectQuery).select("_id name").lean();

    const results = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await Task.aggregate([
          { $match: { projectId: project._id } },
          { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const stats = { open: 0, "in-progress": 0, review: 0, completed: 0 };
        taskStats.forEach((stat) => { stats[stat._id] = stat.count; });

        const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
        const completionRate = total > 0 ? (stats.completed / total) * 100 : 0;

        return {
          projectId: project._id,
          projectName: project.name,
          taskStats: stats,
          totalTasks: total,
          completionRate: Math.round(completionRate * 10) / 10
        };
      })
    );

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /analytics/projects/health - Project health metrics
router.get('/projects/health', authMiddleware, async (req, res, next) => {
  try {
    const projects = await Project.find().select("_id name").lean();
    const now = new Date();

    const results = await Promise.all(
      projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ projectId: project._id });
        const completedTasks = await Task.countDocuments({ projectId: project._id, status: "completed" });
        const overdueTasks = await Task.countDocuments({ projectId: project._id, taskDate: { $lt: now }, status: { $nin: ["completed"] } });
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        return {
          projectId: project._id,
          projectName: project.name,
          totalTasks,
          completedTasks,
          overdueTasks,
          completionRate: Math.round(completionRate * 10) / 10,
          health: overdueTasks === 0 && completionRate > 70 ? "Good" : overdueTasks > 5 ? "Poor" : "Fair"
        };
      })
    );

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// ==================== USER PRODUCTIVITY (NEW) ====================

// GET /analytics/productivity/users - User productivity metrics
router.get('/productivity/users', authMiddleware, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);
    const mongoose = require('mongoose');

    const users = await require('../models/User').find({ role: { $ne: "admin" } }).select("_id name email").lean();

    const results = await Promise.all(
      users.map(async (user) => {
        const tasksCompleted = await Task.countDocuments({
          assigneeId: user._id,
          status: "completed",
          updatedAt: { $gte: start, $lte: end }
        });

        const workLogResult = await WorkLog.aggregate([
          { $match: { userId: user._id, date: { $gte: start, $lte: end } } },
          { $group: { _id: null, totalMinutes: { $sum: "$durationMinutes" } } }
        ]);

        const totalMinutes = workLogResult[0]?.totalMinutes || 0;

        return {
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          tasksCompleted,
          hoursLogged: Math.round((totalMinutes / 60) * 10) / 10,
          avgHoursPerTask: tasksCompleted > 0 ? Math.round((totalMinutes / 60 / tasksCompleted) * 10) / 10 : 0
        };
      })
    );

    results.sort((a, b) => b.tasksCompleted - a.tasksCompleted);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// ==================== EXPORT (NEW) ====================

// GET /analytics/export/worklogs - Export work logs as CSV
router.get('/export/worklogs', authMiddleware, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate);

    const query = { date: { $gte: start, $lte: end } };
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      query.userId = req.user._id;
    }

    const worklogs = await WorkLog.find(query)
      .populate("userId", "name email")
      .populate("taskId", "title")
      .sort({ date: -1 })
      .lean();

    const csv = [
      ["Date", "User", "Task", "Hours", "Minutes", "Notes"].join(","),
      ...worklogs.map((log) =>
        [
          new Date(log.date).toLocaleDateString(),
          log.userId?.name || "Unknown",
          log.taskId?.title || "No task",
          Math.floor(log.durationMinutes / 60),
          log.durationMinutes % 60,
          `"${(log.notes || "").replace(/"/g, '""')}"`
        ].join(",")
      )
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=worklogs_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /analytics/export/tasks - Export tasks as CSV
router.get('/export/tasks', authMiddleware, async (req, res, next) => {
  try {
    const tasks = await Task.find()
      .populate("projectId", "name")
      .populate("assigneeId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const csv = [
      ["Title", "Project", "Status", "Priority", "Assignee", "Due Date", "Created"].join(","),
      ...tasks.map((task) =>
        [
          `"${task.title.replace(/"/g, '""')}"`,
          task.projectId?.name || "No project",
          task.status,
          task.priority,
          task.assigneeId?.name || "Unassigned",
          task.taskDate ? new Date(task.taskDate).toLocaleDateString() : "",
          new Date(task.createdAt).toLocaleDateString()
        ].join(",")
      )
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=tasks_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
