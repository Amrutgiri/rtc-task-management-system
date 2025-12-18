const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { authMiddleware } = require("../middleware/auth");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const Notification = require("../models/Notification");
/* ---------------------------------------------------------
   ADMIN CHECK MIDDLEWARE
--------------------------------------------------------- */
function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

/* ---------------------------------------------------------
   GET ALL PROJECTS (admin and employees can see assigned ones)
--------------------------------------------------------- */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    // Extract query parameters
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    // Build filter query
    let filter = {};

    // Role-based filtering
    if (req.user.role !== "admin") {
      filter.members = req.user._id;
    }

    // Global search (name or description)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Execute query with pagination and sorting
    const [projects, totalCount] = await Promise.all([
      Project.find(filter)
        .populate("ownerId", "name email role")
        .populate("members", "name email")
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(pageSize))
        .lean(),
      Project.countDocuments(filter)
    ]);

    // Fix projects without ownerId
    const fixedProjects = projects.map(project => {
      if (!project.ownerId) {
        return {
          ...project,
          ownerId: {
            _id: req.user._id,
            name: req.user.name || "Unknown",
            email: req.user.email || "",
            role: req.user.role || "admin"
          }
        };
      }
      return project;
    });

    // Get task counts for each project
    const projectIds = fixedProjects.map(p => p._id);
    const taskCounts = await Task.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      { $group: { _id: "$projectId", count: { $sum: 1 } } }
    ]);

    const taskCountMap = {};
    taskCounts.forEach(tc => {
      taskCountMap[tc._id.toString()] = tc.count;
    });

    const projectsWithCounts = fixedProjects.map(project => ({
      ...project,
      taskCount: taskCountMap[project._id.toString()] || 0
    }));

    res.json({
      data: projectsWithCounts,
      totalCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(totalCount / parseInt(pageSize))
    });
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------
   CREATE PROJECT (ADMIN ONLY)
--------------------------------------------------------- */
router.post(
  "/",
  authMiddleware,
  adminOnly,
  [
    body("name").notEmpty().withMessage("Project name is required"),
    body("key").optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, description, key } = req.body;

      // Ensure we have a valid admin user ID
      const adminId = req.user._id || req.user.id;
      if (!adminId) {
        console.error("❌ ERROR: No admin ID found. req.user:", req.user);
        return res.status(400).json({ message: "User ID not found in auth token" });
      }

      console.log("📝 Creating project for admin:", adminId);

      const project = await Project.create({
        name,
        description,
        key,
        ownerId: new mongoose.Types.ObjectId(adminId), // Explicitly convert to ObjectId
        members: [], // start empty
      });

      res.json(project);
    } catch (error) {
      next(error);
    }
  }
);

/* ---------------------------------------------------------
   UPDATE PROJECT DETAILS (ADMIN ONLY)
   - Prevents accidental removal of ownerId
--------------------------------------------------------- */
router.patch("/:id",
  authMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      // Only allow specific fields to be updated
      const allowedUpdates = ['name', 'description', 'key', 'status'];
      const updates = {};

      allowedUpdates.forEach(field => {
        if (field in req.body) {
          updates[field] = req.body[field];
        }
      });

      const project = await Project.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      )
        .populate("ownerId", "name email")
        .populate("members", "name email")
        .lean();

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (err) {
      next(err);
    }
  }
);

/* ---------------------------------------------------------
   ADD MEMBER TO PROJECT (ADMIN)
--------------------------------------------------------- */
router.post(
  "/:id/members",
  authMiddleware,
  adminOnly,
  [body("userId").notEmpty().withMessage("User ID is required")],
  validate,
  async (req, res, next) => {
    try {
      const { userId } = req.body;

      const updated = await Project.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { members: userId } },
        { new: true }
      )
        .populate("members", "name email")
        .lean();

      await Notification.send(userId, {
        title: "Added to Project",
        body: `You were added to project: ${updated.name}`,
        meta: { projectId: updated._id },
        senderId: req.user._id, // NEW
      });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/* ---------------------------------------------------------
   REMOVE MEMBER FROM PROJECT (ADMIN)
--------------------------------------------------------- */
router.delete("/:id/members/:userId",
  authMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const updated = await Project.findByIdAndUpdate(
        req.params.id,
        { $pull: { members: req.params.userId } },
        { new: true }
      ).lean();

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/* ---------------------------------------------------------
   ARCHIVE / ACTIVATE PROJECT (ADMIN)
--------------------------------------------------------- */
router.patch("/:id/status",
  authMiddleware,
  adminOnly,
  [
    body("status")
      .isIn(["active", "archived"])
      .withMessage("Status must be active or archived")
  ],
  validate,
  async (req, res, next) => {
    try {
      const updated = await Project.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      ).lean();
      if (req.body.status === "archived" || req.body.status === "active") {

        const members = updated.members || [];
        for (const m of members) {
          await Notification.send(m, {
            title: "Project Status Updated",
            body: `Project "${updated.name}" is now ${req.body.status}`,
            meta: { projectId: updated._id },
            senderId: req.user._id, // NEW
          });
        }
      }
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/* ---------------------------------------------------------
   DELETE PROJECT (ADMIN ONLY)
   - Prevent deletion if tasks exist
--------------------------------------------------------- */
router.delete("/:id",
  authMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const taskCount = await Task.countDocuments({ projectId: req.params.id });

      if (taskCount > 0) {
        return res.status(400).json({
          message: "Cannot delete project with existing tasks"
        });
      }

      await Project.findByIdAndDelete(req.params.id);

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// ==================== FILE ATTACHMENTS ====================

const upload = require("../middleware/upload");

// Upload attachments to project
router.post('/:id/attachments/upload',
  authMiddleware,
  upload.array('files', 5),
  async (req, res, next) => {
    try {
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Check if user has access (is member of project or admin)
      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        const isMember = project.members.some(m => m.toString() === req.user._id.toString());
        const isOwner = project.ownerId.toString() === req.user._id.toString();

        if (!isMember && !isOwner) {
          return res.status(403).json({ message: 'You are not authorized to upload to this project' });
        }
      }

      // If no files uploaded
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      // Add file metadata to project attachments
      const newAttachments = req.files.map(file => ({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadedBy: req.user._id
      }));

      project.attachments.push(...newAttachments);
      await project.save();

      // Populate uploadedBy for response
      await project.populate('attachments.uploadedBy', 'name email');

      res.json({
        message: `${req.files.length} file(s) uploaded successfully`,
        attachments: project.attachments
      });

    } catch (error) {
      console.error('Upload error:', error);
      next(error);
    }
  }
);

// Get all attachments for a project
router.get('/:id/attachments',
  authMiddleware,
  async (req, res, next) => {
    try {
      const project = await Project.findById(req.params.id)
        .populate('attachments.uploadedBy', 'name email');

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      res.json(project.attachments);
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
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const attachment = project.attachments.id(req.params.attachmentId);

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
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      const attachment = project.attachments.id(req.params.attachmentId);

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
      await project.save();

      res.json({
        message: 'Attachment deleted successfully',
        attachments: project.attachments
      });

    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
