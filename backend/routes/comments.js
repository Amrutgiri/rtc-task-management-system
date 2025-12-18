const express = require("express");
const router = express.Router();
const Comment = require("../models/Comment");
const Task = require("../models/Task");
const cloudinary = require("../utils/cloudinary");
const upload = require("../middleware/upload");
const { authMiddleware } = require("../middleware/auth");
const { getIO } = require("../socket");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const Notification = require("../models/Notification");
const User = require("../models/User");


// Helper to notify all admins
async function notifyAdmins(title, body, meta = {}) {
  try {
    const admins = await User.find({ role: { $in: ["admin", "superadmin"] } }).select("_id");
    const notifications = admins.map(admin =>
      Notification.send(admin._id, { title, body, meta })
    );
    await Promise.all(notifications);
  } catch (err) {
    console.error("Failed to notify admins:", err);
  }
}

/* ----------------------------------------------------
   CREATE COMMENT
---------------------------------------------------- */
router.post(
  "/",
  authMiddleware,
  [
    body("content").notEmpty(),
    body("taskId").notEmpty().isMongoId(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { content, taskId } = req.body;

      const c = await Comment.create({
        content,
        taskId,
        userId: req.user._id,
      });

      const comment = await Comment.findById(c._id)
        .populate("userId", "name email avatar")
        .lean();

      // SOCKET: Broadcast comment
      const io = getIO();
      io.to(`task_${taskId}`).emit("new-comment", comment);

      // NOTIFICATION: Notify assignee (not self)
      const task = await Task.findById(taskId).lean();
      if (
        task &&
        task.assigneeId &&
        task.assigneeId.toString() !== req.user._id.toString()
      ) {
        io.to(`user_${task.assigneeId}`).emit("notification", {
          title: "New Comment",
          body: `New comment on task ${task.title}`,
          meta: { taskId },
        });
      }

      // 🔔 NOTIFICATION: Notify Admins (Feature Request)
      // "When User Comment on any task then also sent notification to admin"
      if (req.user.role !== "admin" && req.user.role !== "superadmin") {
        await notifyAdmins(
          "New Comment Posted",
          `User ${req.user.name} commented on "${task.title}": ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
          { taskId, commentId: c._id }
        );
      }

      res.json(comment);
    } catch (err) {
      next(err);
    }
  }
);

/* ----------------------------------------------------
   GET COMMENTS FOR A TASK
---------------------------------------------------- */
router.get("/task/:taskId", authMiddleware, async (req, res, next) => {
  try {
    const comments = await Comment.find({
      taskId: req.params.taskId,
      deleted: false,
    })
      .populate("userId", "name email avatar")
      .sort({ createdAt: -1 })
      .lean();
    // ----------------------------------------------------
    // HANDLE @MENTIONS
    // ----------------------------------------------------
    const mentioned = content.match(/@([a-zA-Z0-9_.-]+)/g);

    if (mentioned) {
      const usernames = mentioned.map((m) => m.substring(1));

      // find matching users
      const User = require("../models/User");
      const users = await User.find({ name: { $in: usernames } }).lean();

      for (const u of users) {
        // notify mentioned user
        await Notification.send(u._id, {
          title: "Mentioned in Comment",
          body: `${req.user.name} mentioned you in a comment`,
          meta: { taskId },
          senderId: req.user._id, // NEW
        });

        // real-time socket emit
        io.to(`user_${u._id}`).emit("notification", {
          title: "Mentioned in Comment",
          body: `${req.user.name} mentioned you`,
          meta: { taskId },
        });
      }
    }

    res.json(comments);
  } catch (err) {
    next(err);
  }
});

/* ----------------------------------------------------
   EDIT COMMENT
---------------------------------------------------- */
router.patch(
  "/:id",
  authMiddleware,
  [body("content").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const c = await Comment.findById(req.params.id);

      if (!c) return res.status(404).json({ message: "Comment not found" });

      if (
        c.userId.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      c.content = req.body.content;
      await c.save();

      res.json(c);
    } catch (err) {
      next(err);
    }
  }
);

/* ----------------------------------------------------
   SOFT DELETE COMMENT
---------------------------------------------------- */
router.delete("/:id", authMiddleware, async (req, res, next) => {
  try {
    const c = await Comment.findById(req.params.id);

    if (!c) return res.status(404).json({ message: "Comment not found" });

    if (
      c.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    c.deleted = true;
    await c.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ----------------------------------------------------
   ADD ATTACHMENTS TO COMMENT
---------------------------------------------------- */
router.post(
  "/:id/attachments",
  authMiddleware,
  upload.array("files", 5),
  async (req, res, next) => {
    try {
      const c = await Comment.findById(req.params.id);

      if (!c) return res.status(404).json({ message: "Comment not found" });

      if (
        c.userId.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const files = req.files.map((file) => ({
        url: file.path,
        publicId: file.filename || file.public_id || "",
        fileName: file.originalname,
      }));

      c.attachments.push(...files);
      await c.save();

      res.json(c);
    } catch (err) {
      next(err);
    }
  }
);

/* ----------------------------------------------------
   DELETE SPECIFIC ATTACHMENT
---------------------------------------------------- */
router.delete("/:id/attachments/:publicId",
  authMiddleware,
  async (req, res, next) => {
    try {
      const { id, publicId } = req.params;

      const c = await Comment.findById(id);
      if (!c) return res.status(404).json({ message: "Comment not found" });

      if (
        c.userId.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      )
        return res.status(403).json({ message: "Forbidden" });

      // Remove from Cloudinary
      await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });

      c.attachments = c.attachments.filter((a) => a.publicId !== publicId);
      await c.save();

      res.json(c);
    } catch (err) {
      next(err);
    }
  }
);

/* ----------------------------------------------------
   ADD REACTION (like/dislike)
---------------------------------------------------- */
router.post("/:id/react",
  authMiddleware,
  [
    body("type").isIn(["like", "dislike"]),
  ],
  validate,
  async (req, res, next) => {
    try {
      const c = await Comment.findById(req.params.id);

      if (!c) return res.status(404).json({ message: "Comment not found" });

      const { type } = req.body;

      // Remove user from both lists (clean previous state)
      c.reactions.like = c.reactions.like.filter(
        (u) => u.toString() !== req.user._id.toString()
      );

      c.reactions.dislike = c.reactions.dislike.filter(
        (u) => u.toString() !== req.user._id.toString()
      );

      // Add new reaction
      c.reactions[type].push(req.user._id);

      await c.save();

      res.json(c);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
