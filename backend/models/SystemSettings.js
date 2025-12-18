const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SystemSettingsSchema = new Schema({
    // Singleton identifier (we only want one of these)
    isGlobal: { type: Boolean, default: true, unique: true },

    general: {
        appName: { type: String, default: 'Task Management System' },
        companyName: { type: String, default: 'TechCorp Solutions' },
        supportEmail: { type: String, default: 'support@example.com' },
        maintenanceMode: { type: Boolean, default: false },
        allowRegistration: { type: Boolean, default: true },
    },

    // NEW: Email/SMTP Configuration
    email: {
        smtpHost: { type: String, default: '' },
        smtpPort: { type: Number, default: 587 },
        smtpSecure: { type: Boolean, default: false }, // true for 465, false for other ports
        smtpUser: { type: String, default: '' },
        smtpPassword: { type: String, default: '' },
        fromEmail: { type: String, default: '' },
        fromName: { type: String, default: 'TMS Notifications' },
    },

    // NEW: System Defaults
    defaults: {
        taskPriority: { type: String, default: 'medium', enum: ['low', 'medium', 'high'] },
        taskStatus: { type: String, default: 'open', enum: ['open', 'in-progress', 'review', 'completed'] },
        dateFormat: { type: String, default: 'MM/DD/YYYY' },
        timeZone: { type: String, default: 'UTC' },
    },

    // NEW: Feature Toggles
    features: {
        enableFileUploads: { type: Boolean, default: false },
        enableRealtimeUpdates: { type: Boolean, default: true },
        enableEmailNotifications: { type: Boolean, default: false },
        enableAuditLog: { type: Boolean, default: true },
        enableTaskTemplates: { type: Boolean, default: false },
    },

    security: {
        minPasswordLength: { type: Number, default: 8 },
        requireSpecialChar: { type: Boolean, default: true },
        sessionTimeout: { type: Number, default: 60 },
        maxLoginAttempts: { type: Number, default: 5 },
    },

    notifications: {
        enableEmailNotifications: { type: Boolean, default: true },
        enablePushNotifications: { type: Boolean, default: true },
        dailyDigest: { type: Boolean, default: false },
    }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
