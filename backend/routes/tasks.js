const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Project = require("../models/Project");
const { authMiddleware } = require("../middleware/auth");
const { getIO } = require("../socket");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const upload = require("../middleware/upload");
const Notification = require("../models/Notification");
// Date helpers
const startOfDayISO = (d) => new Date(new Date(d).setHours(0, 0, 0, 0));
const endOfDayISO = (d) => new Date(new Date(d).setHours(23, 59, 59, 999));


const User = require("../models/User");
const { sendTaskAssignmentEmail } = require("../services/emailService");

// Helper to notify all admins
// Helper to notify all admins
async function notifyAdmins(title, body, meta = {}) {
  try {
    const admins = await User.find({ role: { $in: ["admin", "superadmin"] } }).select("_id");
    if (!admins.length) return;

    const notifications = admins.map(admin =>
      Notification.send(admin._id, { title, body, meta })
    );
    await Promise.all(notifications);
  } catch (err) {
    console.error("Failed to notify admins:", err);
  }
}

router.get("/", authMiddleware, async (req, res) => {
  const {
    project, date, start, end, status, assignee, priority,
    // Pagination params
    page,
    pageSize,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search = ''
  } = req.query;

  const q = {};

  // 🔒 SECURITY: Non-admins can strictly only see tasks from projects they are members of
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    // Find projects where user is a member
    const userProjects = await Project.find({ members: req.user._id }).distinct('_id');

    // If specific project requested, verify access
    if (project) {
      const hasAccess = userProjects.some(id => id.toString() === project.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: "You are not a member of this project" });
      }
      q.projectId = project;
    } else {
      // No project specified? Restrict to ALL my projects
      q.projectId = { $in: userProjects };
    }

    // 🔒 STRICT PRIVACY: Regular users (Developers, etc.)
    // Can see:
    // 1. Tasks assigned to them
    // 2. Unassigned tasks (pool)
    // 3. Tasks they created
    if (req.user.role !== "manager") {
      q.$or = [
        { assigneeId: req.user._id },
        { assigneeId: null },
        { createdBy: req.user._id }
      ];
    }
  } else {
    // Admin: can filter by project if provided, otherwise sees all
    if (project) q.projectId = project;
  }

  // Common filters
  if (assignee) q.assigneeId = assignee;
  if (priority) q.priority = priority;
  if (status) q.status = { $in: status.split(",") };

  if (date) {
    q.taskDate = { $gte: startOfDayISO(date), $lte: endOfDayISO(date) };
  } else if (start && end) {
    q.taskDate = { $gte: startOfDayISO(start), $lte: endOfDayISO(end) };
  }

  // Global search (title or description)
  if (search) {
    q.$and = q.$and || [];
    q.$and.push({
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    });
  }

  // Check if pagination requested
  const isPaginated = page && pageSize;

  if (isPaginated) {
    // Paginated response
    const totalCount = await Task.countDocuments(q);
    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    const tasks = await Task.find(q)
      .populate("projectId", "name")
      .populate("assigneeId", "name email")
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(pageSize))
      .lean();

    res.json({
      data: tasks,
      totalCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(totalCount / parseInt(pageSize))
    });
  } else {
    // Original behavior - return all tasks
    const tasks = await Task.find(q)
      .populate("projectId", "name")
      .populate("assigneeId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json(tasks);
  }
});

// ==================== BULK OPERATIONS (ADMIN) ====================

// PUT /tasks/bulk/update - Bulk update tasks
router.put("/bulk/update", authMiddleware, async (req, res, next) => {
  try {
    // Only admins can bulk update
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const { taskIds, updates } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: "Task IDs array is required" });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Updates object is required" });
    }

    // Allowed fields for bulk update
    const allowedFields = ['status', 'priority', 'assigneeId'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid update fields provided" });
    }

    // Perform bulk update
    const result = await Task.updateMany(
      { _id: { $in: taskIds } },
      { $set: updateData }
    );

    // Notify if assignee changed
    if (updates.assigneeId) {
      const tasks = await Task.find({ _id: { $in: taskIds } }).select('title');
      await Notification.send(updates.assigneeId, {
        title: "Tasks Assigned",
        body: `You have been assigned ${tasks.length} task(s)`,
        meta: { type: "bulk_assignment" }
      });
    }

    res.json({
      message: `${result.modifiedCount} task(s) updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/bulk/delete - Bulk delete tasks
router.delete("/bulk/delete", authMiddleware, async (req, res, next) => {
  try {
    // Only admins can bulk delete
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: "Task IDs array is required" });
    }

    // Perform bulk delete
    const result = await Task.deleteMany({ _id: { $in: taskIds } });

    res.json({
      message: `${result.deletedCount} task(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    next(err);
  }
});

// GET /tasks/orphaned - Get orphaned/unassigned tasks
router.get("/orphaned", authMiddleware, async (req, res, next) => {
  try {
    // Only admins can view orphaned tasks
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Unauthorized. Admin access required." });
    }

    const orphanedTasks = await Task.find({
      $or: [
        { assigneeId: null },
        { projectId: null }
      ]
    })
      .populate("projectId", "name")
      .populate("assigneeId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      count: orphanedTasks.length,
      tasks: orphanedTasks
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", authMiddleware, async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("projectId", "name")
    .populate("assigneeId", "name email")
    .lean();

  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

router.post(
  "/",
  authMiddleware,
  [
    body("title").notEmpty(),
    body("projectId").notEmpty(),
    body("priority").optional().isIn(["low", "medium", "high"]),
    body("status").optional().isIn(["open", "in-progress", "review", "completed"]),
  ],
  validate,
  async (req, res, next) => {
    try {
      const data = req.body;

      // 🔒 SECURITY: Verify user is member of the project
      if (req.user.role !== "admin" && req.user.role !== "superadmin") {
        const project = await Project.findById(data.projectId);
        if (!project) return res.status(404).json({ message: "Project not found" });

        const isMember = project.members.some(m => m.toString() === req.user._id.toString());
        if (!isMember) {
          return res.status(403).json({ message: "You are not a member of this project" });
        }
      }

      data.createdBy = req.user._id;

      if (!data.taskDate) data.taskDate = startOfDayISO(new Date());

      const task = await Task.create(data);

      // 🔥 INCREMENT TASK COUNT
      await Project.incrementTaskCount(task.projectId);

      // 🔔 Notify assignee
      if (task.assigneeId) {
        await Notification.send(task.assigneeId, {
          title: "New Task Assigned",
          body: `You have been assigned: ${task.title}`,
          meta: { taskId: task._id },
        });

        // 📧 Send email notification
        try {
          const assignee = await User.findById(task.assigneeId);
          const project = await Project.findById(task.projectId);

          if (assignee) {
            await sendTaskAssignmentEmail(assignee, task, project);
            console.log(`✅ Task assignment email sent to ${assignee.email}`);
          }
        } catch (emailError) {
          // Don't fail task creation if email fails
          console.error('❌ Failed to send task assignment email:', emailError.message);
        }
      }

      // 🔔 Notify Admins if created by User
      if (req.user.role !== "admin" && req.user.role !== "superadmin") {
        await notifyAdmins(
          "New Task Created",
          `User ${req.user.name} created task "${task.title}"`,
          { taskId: task._id }
        );
      }

      // 🔔 Notify Admins if created by User
      if (req.user.role !== "admin" && req.user.role !== "superadmin") {
        await notifyAdmins(
          "New Task Created",
          `User ${req.user.name} created task "${task.title}"`,
          { taskId: task._id }
        );
      }

      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  authMiddleware,
  [
    body("priority").optional().isIn(["low", "medium", "high"]),
    body("status").optional().isIn(["open", "in-progress", "review", "completed"]),
    body("taskDate").optional().isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const existing = await Task.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Task not found" });

      // 🔒 SECURITY: Verify ownership/access
      if (req.user.role !== "admin" && req.user.role !== "superadmin" && req.user.role !== "manager") {
        const isAssignee = existing.assigneeId && existing.assigneeId.toString() === req.user._id.toString();
        const isCreator = existing.createdBy && existing.createdBy.toString() === req.user._id.toString();
        const isUnassigned = !existing.assigneeId;

        if (!isAssignee && !isCreator && !isUnassigned) {
          return res.status(403).json({ message: "You are not authorized to update this task" });
        }
      }

      const oldProject = existing.projectId.toString();
      const oldStatus = existing.status;
      const oldAssignee = existing.assigneeId?.toString();
      const newProject = req.body.projectId || oldProject;

      Object.assign(existing, req.body);
      await existing.save();

      // 🔄 PROJECT CHANGED? update counters
      if (newProject !== oldProject) {
        await Project.decrementTaskCount(oldProject);
        await Project.incrementTaskCount(newProject);
      }

      const updated = await Task.findById(existing._id)
        .populate("projectId", "name")
        .populate("assigneeId", "name email")
        .lean();

      // ---------- STATUS CHANGED ----------
      if (req.body.status && req.body.status !== oldStatus) {
        if (existing.assigneeId) {
          await Notification.send(existing.assigneeId, {
            title: "Task Status Updated",
            body: `Task "${existing.title}" changed from ${oldStatus} → ${req.body.status}`,
            meta: { taskId: existing._id },
          });
        }

        // 🔔 Notify Admins if completed
        if (req.body.status === "completed") {
          const userName = req.user.name || req.user.email || "User";
          await notifyAdmins(
            "Task Completed",
            `User ${userName} completed task "${existing.title}"`,
            { taskId: existing._id }
          );
        }
      }

      // ---------- REASSIGNED ----------
      if (req.body.assigneeId && req.body.assigneeId !== oldAssignee) {
        await Notification.send(req.body.assigneeId, {
          title: "Task Reassigned",
          body: `You were assigned task: ${existing.title}`,
          meta: { taskId: existing._id },
        });
      }


      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// Support PUT method (alias for PATCH)
router.put(
  "/:id",
  authMiddleware,
  [
    body("priority").optional().isIn(["low", "medium", "high"]),
    body("status").optional().isIn(["open", "in-progress", "review", "completed"]),
    body("taskDate").optional().isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const existing = await Task.findById(req.params.id);
      if (!existing) return res.status(404).json({ message: "Task not found" });

      // 🔒 SECURITY: Verify ownership/access
      if (req.user.role !== "admin" && req.user.role !== "superadmin" && req.user.role !== "manager") {
        const isAssignee = existing.assigneeId && existing.assigneeId.toString() === req.user._id.toString();
        const isCreator = existing.createdBy && existing.createdBy.toString() === req.user._id.toString();
        const isUnassigned = !existing.assigneeId;

        if (!isAssignee && !isCreator && !isUnassigned) {
          return res.status(403).json({ message: "You are not authorized to update this task" });
        }
      }

      const oldProject = existing.projectId.toString();
      const oldStatus = existing.status;
      const oldAssignee = existing.assigneeId?.toString();
      const newProject = req.body.projectId || oldProject;

      Object.assign(existing, req.body);
      await existing.save();

      // 🔄 PROJECT CHANGED? update counters
      if (newProject !== oldProject) {
        await Project.decrementTaskCount(oldProject);
        await Project.incrementTaskCount(newProject);
      }

      const updated = await Task.findById(existing._id)
        .populate("projectId", "name")
        .populate("assigneeId", "name email")
        .lean();

      // ---------- STATUS CHANGED ----------
      if (req.body.status && req.body.status !== oldStatus) {
        if (existing.assigneeId) {
          await Notification.send(existing.assigneeId, {
            title: "Task Status Updated",
            body: `Task "${existing.title}" changed from ${oldStatus} → ${req.body.status}`,
            meta: { taskId: existing._id },
          });
        }

        // 🔔 Notify Admins if completed (Added to PUT)
        if (req.body.status === "completed") {
          const userName = req.user.name || req.user.email || "User";
          await notifyAdmins(
            "Task Completed",
            `User ${userName} completed task "${existing.title}"`,
            { taskId: existing._id }
          );
        }
      }

      // ---------- REASSIGNED ----------
      if (req.body.assigneeId && req.body.assigneeId !== oldAssignee) {
        await Notification.send(req.body.assigneeId, {
          title: "Task Reassigned",
          body: `You were assigned task: ${existing.title}`,
          meta: { taskId: existing._id },
        });
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: "Task not found" });

    // 🔒 SECURITY: Only Admin/Manager or Creator can delete
    if (req.user.role !== "admin" && req.user.role !== "superadmin" && req.user.role !== "manager") {
      const isCreator = task.createdBy && task.createdBy.toString() === req.user._id.toString();
      if (!isCreator) {
        return res.status(403).json({ message: "You are not authorized to delete this task" });
      }
    }

    await Task.findByIdAndDelete(req.params.id);

    // 🔥 DECREMENT taskCount
    await Project.decrementTaskCount(task.projectId);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});


// ==================== FILE ATTACHMENTS ====================

// Upload attachments to task
router.post('/:id/attachments/upload',
  authMiddleware,
  upload.array('files', 5),
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check if user has access (is member of project or admin)
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        const project = await Project.findById(task.projectId);
        const isMember = project.members.some(m => m.toString() === req.user._id.toString());

        if (!isMember) {
          return res.status(403).json({ message: 'You are not authorized to upload to this task' });
        }
      }

      // If no files uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      // Add file metadata to task attachments
      const newAttachments = req.files.map(file => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadedBy: req.user._id
      }));

      task.attachments.push(...newAttachments);
      await task.save();

      // Populate uploadedBy for response
      await task.populate('attachments.uploadedBy', 'name email');

      res.json({
        message: `${req.files.length} file(s) uploaded successfully`,
        attachments: task.attachments
      });

    } catch (error) {
      console.error('Upload error:', error);
      next(error);
    }
  }
);

// Get all attachments for a task
router.get('/:id/attachments',
  authMiddleware,
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id)
        .populate('attachments.uploadedBy', 'name email');

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      res.json(task.attachments);
    } catch (error) {
      next(error);
    }
  }
);

// Download an attachment
router.get('/:id/attachments/:attachmentId/download',
  authMiddleware,
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const attachment = task.attachments.id(req.params.attachmentId);

      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }

      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(attachment.path)) {
        return res.status(404).json({ message: 'File not found on server' });
      }

      // Send file for download
      res.download(attachment.path, attachment.filename, (err) => {
        if (err) {
          console.error('Download error:', err);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error downloading file' });
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }
);

// Delete an attachment
router.delete('/:id/attachments/:attachmentId',
  authMiddleware,
  async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const attachment = task.attachments.id(req.params.attachmentId);

      if (!attachment) {
        return res.status(404).json({ message: 'Attachment not found' });
      }

      // Check permissions: owner of upload or admin
      const isOwner = attachment.uploadedBy.toString() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: 'Unauthorized to delete this attachment' });
      }

      // Delete file from filesystem
      const fs = require('fs');
      if (fs.existsSync(attachment.path)) {
        fs.unlinkSync(attachment.path);
      }

      // Remove from database
      attachment.remove();
      await task.save();

      res.json({
        message: 'Attachment deleted successfully',
        attachments: task.attachments
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;