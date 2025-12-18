const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const Task = require("../models/Task");
const Project = require("../models/Project");
const Notification = require("../models/Notification");

// @route   GET /dashboard
// @desc    Get dashboard stats for current user
// @access  Private
router.get("/", authMiddleware, async (req, res, next) => {
    try {
        const userId = req.user._id;

        // 0. Get User's Projects (to filter Unassigned tasks)
        const myProjects = await Project.find({ members: userId }).select('_id');
        const myProjectIds = myProjects.map(p => p._id);

        // 🔍 COMMON FILTER: Match Kanban logic
        // 1. Projects I am in OR (Tasks I created if not in project?? No, usually strictly project based)
        // STRICTER: Task must be in my projects AND (Assigned to me OR Unassigned OR Created by me)
        const taskFilter = {
            projectId: { $in: myProjectIds },
            $or: [
                { assigneeId: userId },
                { assigneeId: null },
                { createdBy: userId }
            ]
        };

        // 1. My Tasks (Active)
        const myTasksCount = await Task.countDocuments({
            ...taskFilter,
            status: { $ne: "completed" }
        });

        // 2. Active Projects (Member of)
        const myProjectsCount = await Project.countDocuments({
            members: userId,
            status: "active"
        });

        // 3. Completed This Week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const completedThisWeek = await Task.countDocuments({
            ...taskFilter,
            status: "completed",
            updatedAt: { $gte: oneWeekAgo }
        });

        // 4. Unread Notifications
        const unreadNotifications = await Notification.countDocuments({
            userId: userId,
            read: false
        });

        // 5. Tasks by Status (For Chart/Overview)
        // Aggregate is faster
        const statusStats = await Task.aggregate([
            { $match: taskFilter },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const tasksByStatus = {
            open: 0,
            "in-progress": 0,
            review: 0,
            completed: 0
        };

        statusStats.forEach(stat => {
            if (tasksByStatus[stat._id] !== undefined) {
                tasksByStatus[stat._id] = stat.count;
            }
        });

        // 6. Recent Tasks (Last 5 updated)
        const recentActivity = await Task.find(taskFilter)
            .populate("projectId", "name")
            .sort({ updatedAt: -1 })
            .limit(5)
            .lean();

        // 7. Upcoming Deadlines (Next 7 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        const upcomingDeadlines = await Task.find({
            ...taskFilter,
            status: { $ne: "completed" },
            taskDate: { $gte: today, $lte: nextWeek }
        })
            .populate("projectId", "name")
            .sort({ taskDate: 1 })
            .limit(5)
            .lean();

        res.json({
            stats: {
                myTasks: myTasksCount,
                myProjects: myProjectsCount,
                completedThisWeek,
                pendingNotifications: unreadNotifications
            },
            tasksByStatus,
            recentActivity,
            upcomingDeadlines
        });

    } catch (err) {
        next(err);
    }
});

module.exports = router;
