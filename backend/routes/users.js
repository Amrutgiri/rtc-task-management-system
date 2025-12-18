const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { authMiddleware } = require("../middleware/auth");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const Notification = require("../models/Notification");
const { sendVerificationEmail, sendApprovalEmail, sendRejectionEmail } = require("../services/emailService");

function adminOnly(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

/* ---------------------------------------------------------
   GET ALL USERS (Admin + Manager)
--------------------------------------------------------- */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    if (!["admin", "manager"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Extract query parameters
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
      role,
      active
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    // Build filter query
    const filter = {};

    // Global search (name or email)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Role filter
    if (role && role !== 'all') {
      filter.role = role;
    }

    // Active status filter
    if (active !== undefined && active !== 'all') {
      filter.active = active === 'true' || active === true;
    }

    // Execute query with pagination and sorting
    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select("-passwordHash")
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(pageSize))
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      data: users,
      totalCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(totalCount / parseInt(pageSize))
    });
  } catch (err) {
    next(err);
  }
});

/* ---------------------------------------------------------
   CREATE USER (Admin only)
--------------------------------------------------------- */
router.post(
  "/",
  authMiddleware,
  adminOnly,
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("role").optional().isIn(["admin", "manager", "developer"]),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 chars"),
  ],
  validate,
  async (req, res, next) => {
    try {
      let { name, email, password, role } = req.body;

      // Check if user already exists
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      let passwordHash = null;
      if (password) {
        passwordHash = await bcrypt.hash(password, 10);
      }

      // Generate verification token
      const crypto = require('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      const user = await User.create({
        name,
        email,
        role: role || "developer",
        passwordHash,
        active: false, // Pending email verification
        isVerified: false,
        verificationToken,
        verificationTokenExpires
      });

      // Send verification email
      try {
        await sendVerificationEmail(user, verificationToken);
        console.log(`📧 Verification email sent to ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // Don't fail user creation if email fails
      }

      res.json({
        message: "User created successfully. Verification email sent.",
        user: { id: user._id, name: user.name, email: user.email, active: user.active }
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ---------------------------------------------------------
   UPDATE USER (Admin)
--------------------------------------------------------- */
router.patch("/:id",
  authMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const allowed = ["name", "email", "role", "active", "avatar"];
      const update = {};

      for (const key of allowed) {
        if (req.body[key] !== undefined) update[key] = req.body[key];
      }

      const user = await User.findByIdAndUpdate(req.params.id, update, {
        new: true,
      }).select("-passwordHash");

      res.json(user);
    } catch (err) {
      next(err);
    }
  });

/* ---------------------------------------------------------
   RESET PASSWORD (Admin)
--------------------------------------------------------- */
router.patch("/:id/reset-password",
  authMiddleware,
  adminOnly,
  [body("password").isLength({ min: 6 })],
  validate,
  async (req, res, next) => {
    try {
      const passwordHash = await bcrypt.hash(req.body.password, 10);

      const user = await User.findByIdAndUpdate(
        req.params.id,
        {
          passwordHash,
          passwordChangedAt: new Date(),
        },
        { new: true }
      );

      res.json({ message: "Password reset successful" });
    } catch (err) {
      next(err);
    }
  });

/* ---------------------------------------------------------
   USER SELF PROFILE
--------------------------------------------------------- */
router.get("/profile", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user._id).select("-passwordHash");
  res.json(user);
});

/* ---------------------------------------------------------
   USER SELF UPDATE
--------------------------------------------------------- */
router.patch("/profile",
  authMiddleware,
  async (req, res, next) => {
    try {
      const allowed = ["name", "avatar"];
      const update = {};

      for (const key of allowed) {
        if (req.body[key] !== undefined) update[key] = req.body[key];
      }

      const user = await User.findByIdAndUpdate(req.user._id, update, {
        new: true,
      }).select("-passwordHash");

      res.json(user);
    } catch (err) {
      next(err);
    }
  });

/* ---------------------------------------------------------
   CHANGE PASSWORD (Self)
--------------------------------------------------------- */
router.patch("/change-password",
  authMiddleware,
  [
    body("oldPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      const match = await bcrypt.compare(req.body.oldPassword, user.passwordHash);

      if (!match)
        return res.status(400).json({ message: "Old password incorrect" });

      user.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
      user.passwordChangedAt = new Date();
      await user.save();

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      next(err);
    }
  });

/* ---------------------------------------------------------
   APPROVE USER (Admin only)
--------------------------------------------------------- */
router.patch(
  "/:id/approve",
  authMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.active) {
        return res.status(400).json({ message: "User is already active" });
      }

      // Activate user
      user.active = true;
      await user.save();

      // Send approval email
      try {
        await sendApprovalEmail(user);
        console.log(`📧 Approval email sent to ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
      }

      res.json({
        message: "User approved successfully",
        user: { id: user._id, name: user.name, email: user.email, active: user.active }
      });
    } catch (err) {
      next(err);
    }
  }
);

/* ---------------------------------------------------------
   REJECT USER (Admin only)
--------------------------------------------------------- */
router.delete(
  "/:id/reject",
  authMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { reason } = req.body;

      // Send rejection email before deleting
      try {
        await sendRejectionEmail(user, reason);
        console.log(`📧 Rejection email sent to ${user.email}`);
      } catch (emailError) {
        console.error("Failed to send rejection email:", emailError);
      }

      // Delete user
      await User.findByIdAndDelete(req.params.id);

      res.json({ message: "User rejected and removed" });
    } catch (err) {
      next(err);
    }
  }
);

/* ---------------------------------------------------------
   DELETE USER PERMANENTLY (Admin only)
--------------------------------------------------------- */
router.delete("/:id",
  authMiddleware,
  adminOnly,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting yourself
      if (user._id.toString() === req.user.id) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }

      // Permanently delete user
      await User.findByIdAndDelete(req.params.id);

      res.json({ message: "User permanently deleted", user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
