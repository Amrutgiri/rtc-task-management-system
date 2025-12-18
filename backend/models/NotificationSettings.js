const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSettingsSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true,
    index: true
  },

  // Global notification controls
  emailNotifications: {
    type: Boolean,
    default: true,
  },

  pushNotifications: {
    type: Boolean,
    default: true,
  },

  soundAlerts: {
    type: Boolean,
    default: true,
  },

  // Mute specific items
  mutedProjects: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
  ],

  mutedTasks: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
  ],

  // Mute notifications from specific users (e.g., manager spam)
  mutedUsers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  ],

  // Notification frequency (immediate, daily digest, never)
  frequency: {
    type: String,
    enum: ['immediate', 'daily', 'never'],
    default: 'immediate',
  },

  // Do not disturb hours (e.g., 9 PM to 7 AM)
  quietHours: {
    enabled: { type: Boolean, default: false },
    startTime: { type: String, default: '21:00' }, // HH:mm format
    endTime: { type: String, default: '07:00' },
  },

  // Types of notifications to receive
  notificationTypes: {
    taskAssigned: { type: Boolean, default: true },
    taskCommented: { type: Boolean, default: true },
    taskStatusChanged: { type: Boolean, default: true },
    projectUpdated: { type: Boolean, default: true },
    mentionedInComment: { type: Boolean, default: true },
  },

}, { timestamps: true });

module.exports = mongoose.model('NotificationSettings', NotificationSettingsSchema);
