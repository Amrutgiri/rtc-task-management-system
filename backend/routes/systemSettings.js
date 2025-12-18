const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// @route   GET /api/system-settings
// @desc    Get system settings (create default if not exists)
// @access  Private/Admin
router.get('/', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        let settings = await SystemSettings.findOne({ isGlobal: true });

        if (!settings) {
            // First time init
            settings = new SystemSettings();
            await settings.save();
        }

        res.json(settings);
    } catch (err) {
        next(err);
    }
});

// @route   PUT /api/system-settings
// @desc    Update system settings
// @access  Private/Admin
router.put('/', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { general, email, defaults, features, security, notifications } = req.body;

        let settings = await SystemSettings.findOne({ isGlobal: true });

        if (!settings) {
            settings = new SystemSettings();
        }

        if (general) settings.general = { ...settings.general, ...general };
        if (email) settings.email = { ...settings.email, ...email };
        if (defaults) settings.defaults = { ...settings.defaults, ...defaults };
        if (features) settings.features = { ...settings.features, ...features };
        if (security) settings.security = { ...settings.security, ...security };
        if (notifications) settings.notifications = { ...settings.notifications, ...notifications };

        await settings.save();
        res.json(settings);
    } catch (err) {
        next(err);
    }
});

// @route   POST /api/system-settings/test-email
// @desc    Test email configuration by sending a test email
// @access  Private/Admin
router.post('/test-email', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const { testEmailAddress } = req.body;

        if (!testEmailAddress) {
            return res.status(400).json({ message: 'Test email address is required' });
        }

        const settings = await SystemSettings.findOne({ isGlobal: true });

        if (!settings || !settings.email.smtpHost || !settings.email.smtpUser) {
            return res.status(400).json({ message: 'Email configuration is incomplete' });
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: settings.email.smtpHost,
            port: settings.email.smtpPort,
            secure: settings.email.smtpSecure,
            auth: {
                user: settings.email.smtpUser,
                pass: settings.email.smtpPassword
            }
        });

        // Send test email
        await transporter.sendMail({
            from: `"${settings.email.fromName}" <${settings.email.fromEmail}>`,
            to: testEmailAddress,
            subject: 'TMS Email Configuration Test',
            html: `
                <h2>Email Configuration Test</h2>
                <p>This is a test email from your Task Management System.</p>
                <p>If you're receiving this, your email configuration is working correctly!</p>
                <hr>
                <small>Sent at ${new Date().toLocaleString()}</small>
            `
        });

        res.json({
            success: true,
            message: `Test email sent successfully to ${testEmailAddress}`
        });
    } catch (err) {
        console.error('Test email error:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to send test email: ' + err.message
        });
    }
});

module.exports = router;
