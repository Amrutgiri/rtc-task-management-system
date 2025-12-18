const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const Notification = require("../models/Notification");
const SystemSettings = require('../models/SystemSettings');
const { notifyAdminNewRegistration } = require('../services/emailService');

// PUBLIC REGISTRATION
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      // Check if user exists
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create User (Default role: developer, pending approval)
      const user = await User.create({
        name,
        email,
        passwordHash,
        role: "developer",
        active: false, // Pending admin approval
        isVerified: false
      });

      // Notify admin(s) about new registration
      try {
        const admins = await User.find({ role: 'admin', active: true });
        for (const admin of admins) {
          await notifyAdminNewRegistration(user, admin.email);
        }
        console.log(`📧 Notified ${admins.length} admin(s) about new registration: ${user.email}`);
      } catch (emailError) {
        console.error("Failed to notify admins about registration:", emailError);
        // Don't fail registration if email fails
      }

      res.status(201).json({
        message: "Registration successful! Your account is pending admin approval. You'll receive an email once approved.",
        user: { id: user._id, name: user.name, email: user.email }
      });

    } catch (err) {
      next(err);
    }
  }
);


// TEMPORARY: Bootstrap endpoint to create/fix admin user
// Remove this after first successful login
router.post('/bootstrap-admin', async (req, res, next) => {
  try {
    const email = 'apgoswami.eww@gmail.com';
    const password = 'password123';

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Try to update existing user, or create new one
    const user = await User.findOneAndUpdate(
      { email },
      {
        name: 'Admin User',
        email,
        passwordHash,
        role: 'admin',
        active: true,
      },
      { upsert: true, new: true }
    );

    res.json({
      message: 'Admin user created/updated successfully',
      email,
      password,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// LOGIN
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isString().notEmpty().withMessage('Password required'),
],
  validate, async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check password
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Check if user account is active
      if (!user.active) {
        return res.status(403).json({
          message: "Your account is pending admin approval. You'll receive an email once approved."
        });
      }

      // Check if system is in maintenance mode (only allow admin)
      const settings = await SystemSettings.findOne();
      if (settings?.maintenanceMode && user.role !== 'admin') {
        return res
          .status(503)
          .json({ message: "System is under maintenance. Only admins can log in." });
      }

      // Track login activity
      user.lastLogin = new Date();
      user.lastActivity = new Date();
      await user.save();

      // Create JWT
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      // return token and normalized user
      res.json({ token, user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      next(err);
    }

  });

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      // Security: Don't reveal user doesn't exist
      return res.json({ message: "If email exists, reset link sent." });
    }

    // Generate Token
    const token = require('crypto').randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // TODO: Send Email
    // For now, Log to Console
    console.log("-----------------------------------------");
    console.log("RESET PASSWORD TOKEN:", token);
    console.log("-----------------------------------------");

    res.json({ message: "If email exists, reset link sent." });
  } catch (err) {
    next(err);
  }
});

// RESET PASSWORD
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], validate, async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.passwordChangedAt = Date.now();
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
});

// EMAIL VERIFICATION ROUTE
router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    // Find user with valid token
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token"
      });
    }

    // Activate user and clear verification token
    user.isVerified = true;
    user.active = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({
      message: "Email verified successfully! You can now log in.",
      verified: true
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;
