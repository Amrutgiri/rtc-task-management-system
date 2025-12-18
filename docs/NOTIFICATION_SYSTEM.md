# Notification System - Complete Implementation Guide

## Overview

A comprehensive real-time notification system with:
- ✅ Full-screen paginated notification list
- ✅ Mark all notifications as read
- ✅ Sound alerts with Web Audio API
- ✅ Browser push notifications
- ✅ Task/project icons in notifications
- ✅ Per-user notification settings (mute preferences)
- ✅ Do Not Disturb hours
- ✅ Notification frequency control

---

## Backend Implementation

### 1. NotificationSettings Model

**Location**: `backend/models/NotificationSettings.js`

```javascript
// Fields
- userId: ObjectId (User, unique)
- emailNotifications: Boolean (default: true)
- pushNotifications: Boolean (default: true)
- soundAlerts: Boolean (default: true)
- mutedProjects: [ObjectId] (array of Project IDs)
- mutedTasks: [ObjectId] (array of Task IDs)
- mutedUsers: [ObjectId] (array of User IDs)
- frequency: String ('immediate', 'daily', 'never') - default: 'immediate'
- quietHours: {
    enabled: Boolean,
    startTime: String (HH:mm),
    endTime: String (HH:mm)
  }
- notificationTypes: {
    taskAssigned: Boolean,
    taskCommented: Boolean,
    taskStatusChanged: Boolean,
    projectUpdated: Boolean,
    mentionedInComment: Boolean
  }
```

### 2. Notification Settings Routes

**Location**: `backend/routes/notificationSettings.js`

```bash
# Get user's settings
GET /notification-settings
- Response: { userId, emailNotifications, soundAlerts, ... }

# Update settings
PATCH /notification-settings
- Body: { emailNotifications?, soundAlerts?, quietHours?, ... }
- Response: Updated settings object

# Mute/Unmute project
POST /notification-settings/mute-project/:projectId
- Response: { success: true, muted: boolean, mutedProjects: [] }

# Mute/Unmute task
POST /notification-settings/mute-task/:taskId
- Response: { success: true, muted: boolean, mutedTasks: [] }

# Mute/Unmute user
POST /notification-settings/mute-user/:userId
- Response: { success: true, muted: boolean, mutedUsers: [] }
```

### 3. Enhanced Notifications Routes

**Location**: `backend/routes/notifications.js` (Updated)

```bash
# Get paginated notifications
GET /notifications?page=1&limit=20&read=false
- Query params: page, limit, read ('true'/'false'/undefined)
- Response: {
    total: Number,
    page: Number,
    limit: Number,
    pages: Number,
    notifications: Array (enriched with icons & type)
  }

# Mark notification as read
PATCH /notifications/:id/read
- Response: Updated notification

# Mark all as read
PATCH /notifications/mark-all/read
- Response: { success: true, modified: Number }

# Get unread count
GET /notifications/count/unread
- Response: { unreadCount: Number }

# Delete notification
DELETE /notifications/:id
- Response: { success: true }

# Send notification (admin)
POST /notifications
- Body: { userId, title, body?, meta?, playSoundAlert? }
- Response: Created notification
```

### 4. Enhanced Socket.IO Integration

**Location**: `backend/socket.js` (Updated)

**Features**:
- Checks NotificationSettings before emitting
- Respects muted projects/tasks/users
- Respects quiet hours and frequency settings
- Includes sound/push flags in payload
- Better logging

```javascript
io.sendNotificationToUser(userId, {
  title: 'Task Updated',
  body: 'Your task was updated',
  meta: { taskId: '...', projectId: '...' },
  playSoundAlert: true,
  sendPush: true
})
```

### 5. Server Setup

**Location**: `backend/server.js` (Updated)

New route mounted:
```javascript
app.use("/notification-settings", notificationSettingsRoutes);
```

---

## Frontend Implementation

### 1. NotificationContext

**Location**: `frontend/src/context/NotificationContext.tsx`

**State**:
- `notifications`: Array of notification objects
- `unread`: Count of unread notifications
- `settings`: User's notification settings
- `browserNotificationSupported`: Boolean

**Methods**:
```typescript
// Data loading
loadNotifications()      // Fetch from API
loadSettings()          // Fetch user settings
getUnreadCount()        // Get unread count

// Actions
markAsRead(id)          // Mark single as read
markAllAsRead()         // Mark all as read
deleteNotification(id)  // Delete notification

// Sound & Notifications
playSound()             // Play notification sound
sendBrowserNotification(title, options)
requestNotificationPermission()

// Auto-handles:
- Real-time socket.io listeners
- Sound alerts when new notifications arrive
- Browser push notifications
- Respects user settings
```

### 2. Notifications Page

**Location**: `frontend/src/pages/Notifications.tsx`

**Features**:
- Full-screen paginated list (15 per page)
- Filter tabs: All / Unread / Read
- Mark all as read button
- Individual notification actions (mark as read, delete)
- Task/project icons and metadata
- Timestamps (relative: "5m ago", "2h ago", etc.)
- Responsive design
- Empty state handling

**Components Used**:
- React-Bootstrap: Container, Card, Badge, Button, Pagination
- Custom CSS: `notifications.css`

### 3. NotificationSettings Page

**Location**: `frontend/src/pages/NotificationSettings.tsx`

**Features**:
- Global Controls: Email, Push, Sound toggles
- Frequency selection: Immediate, Daily, Never
- Notification Types: 5 toggleable types
- Do Not Disturb: Enable with start/end time
- Muted Items summary with removable badges
- Save/Reset buttons with loading state

**Sections**:
1. Global Controls
2. Notification Frequency
3. Notification Types
4. Do Not Disturb Hours
5. Muted Items Summary

### 4. Updated NotificationBell Component

**Location**: `frontend/src/components/NotificationBell.tsx`

**Changes**:
- Shows unread count instead of total
- Displays "99+" if unread > 99
- Clickable button that navigates to `/notifications`
- Better styling with Bootstrap

### 5. Sound Manager Utility

**Location**: `frontend/src/utils/soundManager.ts`

**Features**:
- Web Audio API for beep sounds (cross-browser)
- HTML5 Audio fallback
- Sound patterns (ding, chime, beep)
- Volume control
- Enable/disable functionality

**Methods**:
```typescript
soundManager.playBeep(frequency, duration)
soundManager.playSound(soundType)        // 'ding', 'chime', 'beep'
soundManager.playNotificationPattern()   // beep-pause-beep
soundManager.setVolume(0-1)
soundManager.setEnabled(boolean)

// Utilities
requestAudioPermission()
isAudioSupported()
requestNotificationPermission()
sendBrowserNotification(title, options)
isNotificationSupported()
```

### 6. Notification API Calls

**Location**: `frontend/src/api/notifications.ts`

```typescript
getNotifications(page, limit, read?)
getUnreadCount()
markNotificationAsRead(id)
markAllNotificationsAsRead()
deleteNotification(id)
sendNotification(userId, title, body, meta, playSoundAlert)
getNotificationSettings()
updateNotificationSettings(settings)
toggleProjectMute(projectId)
toggleTaskMute(taskId)
toggleUserMute(userId)
```

### 7. useNotifications Hook

**Location**: `frontend/src/hooks/useNotifications.ts`

```typescript
const {
  notifications,
  unread,
  settings,
  loadNotifications,
  loadSettings,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  playSound,
  sendBrowserNotification,
  requestNotificationPermission,
  browserNotificationSupported,
} = useNotifications();
```

### 8. Routes Added

**Location**: `frontend/src/router/AppRouter.tsx`

```typescript
<Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
<Route path="/notification-settings" element={<AuthGuard><NotificationSettings /></AuthGuard>} />
```

### 9. Styling

**Location**: `frontend/src/styles/notifications.css`

**Includes**:
- Notification card styles (unread highlighting)
- Icon styling
- Badge animations
- Pagination styles
- Settings form styling
- Responsive mobile styles
- Hover effects and transitions

---

## Usage Examples

### Sending a Notification (Backend)

```javascript
const { getIO } = require('./socket');
const io = getIO();

// From task update handler
await io.sendNotificationToUser(assigneeId, {
  title: 'New Task Assigned',
  body: `"${task.title}" has been assigned to you`,
  meta: {
    taskId: task._id,
    projectId: task.projectId,
  },
  playSoundAlert: true,
});
```

### Accessing Notifications (Frontend)

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const { 
    notifications, 
    unread, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  return (
    <div>
      <p>Unread: {unread}</p>
      {notifications.map(notif => (
        <div key={notif._id}>
          <h6>{notif.title}</h6>
          <p>{notif.body}</p>
          <button onClick={() => deleteNotification(notif._id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Muting Notifications

```typescript
import { toggleProjectMute, toggleTaskMute } from '../api/notifications';

// Mute notifications for a project
const response = await toggleProjectMute(projectId);
if (response.data.muted) {
  console.log('Project muted');
}

// Mute notifications for a task
await toggleTaskMute(taskId);
```

---

## Settings Schema

### NotificationTypes
- `taskAssigned`: When task is assigned to user
- `taskCommented`: When comment added to user's tasks
- `taskStatusChanged`: When task status changes
- `projectUpdated`: When project is updated
- `mentionedInComment`: When user is mentioned in comments

### Frequency Modes
- `immediate`: Get notified right away (default)
- `daily`: Get one digest email per day
- `never`: Disable all notifications (but still save them)

### Quiet Hours
- `enabled`: Boolean
- `startTime`: HH:mm format (e.g., "21:00")
- `endTime`: HH:mm format (e.g., "07:00")
- Notifications won't appear in UI during these hours, but will be saved

---

## Browser Support

### Notification Features

| Feature | Support |
|---------|---------|
| Sound Alerts (Web Audio API) | Chrome 14+, Firefox 25+, Safari 6+, Edge 12+ |
| Sound Alerts (HTML5 Audio) | All modern browsers |
| Push Notifications | Chrome 50+, Firefox 44+, Safari 16+, Edge 17+ |
| Pagination | All browsers |
| Settings UI | All modern browsers |

### Permissions Required

1. **Sound Alerts**: No special permission (uses Web Audio API)
2. **Push Notifications**: User must grant permission when prompted
3. **Browser Notifications**: Requires explicit user permission

---

## Database Relationships

```
User
├─ NotificationSettings (1:1)
│  ├─ mutedProjects[] → Project
│  ├─ mutedTasks[] → Task
│  └─ mutedUsers[] → User
└─ Notification[] (1:Many)
   └─ meta.taskId → Task
   └─ meta.projectId → Project
```

---

## Error Handling

**Backend**:
- 400: Validation errors
- 401: Unauthorized (missing token)
- 403: Forbidden (admin only)
- 404: Resource not found
- 500: Server errors

**Frontend**:
- Uses try-catch in async functions
- SweetAlert2 for user notifications
- Console error logging
- Graceful fallbacks for sound/push

---

## Performance Considerations

1. **Pagination**: Default 20 items per page, configurable
2. **Lean Queries**: Notification retrieval uses `.lean()` for speed
3. **Mute Checks**: Cached in user settings to avoid DB queries
4. **Socket.IO**: Real-time updates without polling
5. **Sound Manager**: Single instance, no memory leaks

---

## Future Enhancements

- [ ] Email digest compilation and sending
- [ ] Webhook integrations
- [ ] Notification templates/categories
- [ ] User preferences per notification type
- [ ] Analytics dashboard
- [ ] Notification history cleanup (auto-delete old)
- [ ] Priority-based notification ordering
- [ ] Scheduled notifications
- [ ] Notification threads/grouping

---

## Testing Checklist

- [ ] Create notification from admin
- [ ] Receive real-time via Socket.IO
- [ ] Sound plays with default settings
- [ ] Browser push notification appears
- [ ] Mark single as read
- [ ] Mark all as read
- [ ] Delete notification
- [ ] Pagination works
- [ ] Filter tabs (All/Unread/Read)
- [ ] Mute project/task/user
- [ ] Quiet hours block notifications
- [ ] Frequency = 'never' blocks all
- [ ] Sound toggle works
- [ ] Push toggle works
- [ ] Responsive on mobile
- [ ] Settings persist on reload
