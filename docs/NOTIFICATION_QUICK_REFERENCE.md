# 🔔 Notification System - Quick Reference

## Most Important Files

| File | Purpose |
|------|---------|
| `backend/models/NotificationSettings.js` | User settings schema |
| `backend/routes/notificationSettings.js` | Settings API endpoints |
| `frontend/src/pages/Notifications.tsx` | Notifications list page |
| `frontend/src/pages/NotificationSettings.tsx` | Settings page |
| `frontend/src/context/NotificationContext.tsx` | Central notification state |
| `frontend/src/utils/soundManager.ts` | Sound playback utility |

---

## Quick API Reference

### Get & Display Notifications
```bash
GET /notifications?page=1&limit=20&read=false
# Returns: { total, page, limit, pages, notifications[] }
```

### Mark Notifications
```bash
PATCH /notifications/:id/read              # Mark one as read
PATCH /notifications/mark-all/read         # Mark all as read
GET /notifications/count/unread            # Get unread count
DELETE /notifications/:id                  # Delete one
```

### User Settings
```bash
GET /notification-settings                 # Get settings
PATCH /notification-settings               # Update settings
POST /notification-settings/mute-project/:id
POST /notification-settings/mute-task/:id
POST /notification-settings/mute-user/:id
```

---

## Quick Frontend Usage

### In Any Component
```typescript
import { useNotifications } from '../hooks/useNotifications';

const { 
  unread,              // Count of unread
  notifications,       // Array of notifications
  markAllAsRead,       // Function
  deleteNotification,  // Function
  playSound,           // Function
  settings             // User settings object
} = useNotifications();
```

### Navigation
```typescript
// Add to sidebar or header
<NavLink to="/notifications">
  Notifications {unread > 0 && `(${unread})`}
</NavLink>
<NavLink to="/notification-settings">Settings</NavLink>
```

### Send Notification (Backend)
```javascript
const { sendNotificationToUser } = require('../utils/notifications');

await sendNotificationToUser(
  userId,
  'Task Assigned',
  'You have a new task',
  { taskId: '...' },
  true  // play sound
);
```

---

## Settings Structure

```typescript
settings = {
  userId: ObjectId,
  
  // Global toggles
  emailNotifications: boolean,      // default: true
  pushNotifications: boolean,       // default: true
  soundAlerts: boolean,             // default: true
  
  // Frequency
  frequency: 'immediate' | 'daily' | 'never',  // default: immediate
  
  // Muted items
  mutedProjects: [ObjectId],
  mutedTasks: [ObjectId],
  mutedUsers: [ObjectId],
  
  // Quiet hours (9 PM to 7 AM example)
  quietHours: {
    enabled: boolean,
    startTime: "21:00",    // HH:mm
    endTime: "07:00"
  },
  
  // Notification types
  notificationTypes: {
    taskAssigned: boolean,
    taskCommented: boolean,
    taskStatusChanged: boolean,
    projectUpdated: boolean,
    mentionedInComment: boolean
  }
}
```

---

## Routes Added

### Frontend Routes
```
/notifications              → Notifications page
/notification-settings      → Settings page
```

### Backend Routes
```
GET    /notifications                              → List (paginated)
GET    /notifications/count/unread                 → Count
PATCH  /notifications/:id/read                     → Mark read
PATCH  /notifications/mark-all/read                → Mark all read
DELETE /notifications/:id                          → Delete
GET    /notification-settings                      → Get settings
PATCH  /notification-settings                      → Update settings
POST   /notification-settings/mute-project/:id    → Toggle mute
POST   /notification-settings/mute-task/:id       → Toggle mute
POST   /notification-settings/mute-user/:id       → Toggle mute
```

---

## Real-Time Events (Socket.IO)

### Listening
```typescript
// Automatic in NotificationContext
socket.on('notification', (data) => {
  // Handles:
  // - Playing sound if enabled
  // - Showing browser notification if enabled
  // - Adding to notifications list
  // - Respecting mute settings
});
```

### Sending (Backend)
```javascript
const { getIO } = require('./socket');
const io = getIO();

await io.sendNotificationToUser(userId, {
  title: 'Task Updated',
  body: 'Your task status changed',
  meta: { taskId: '...', projectId: '...' },
  playSoundAlert: true,   // Will play sound if user has it enabled
  sendPush: true          // Will send push if user has it enabled
});
```

---

## Sound Manager API

```typescript
import soundManager from '../utils/soundManager';

// Play sounds
soundManager.playBeep(frequency, duration);      // Hz, ms
soundManager.playSound('ding');                  // or 'chime', 'beep'
soundManager.playNotificationPattern();          // beep-pause-beep

// Control
soundManager.setVolume(0.5);                     // 0-1
soundManager.setEnabled(true);                   // Enable/disable
```

---

## Notification Object Shape

```typescript
{
  _id: ObjectId,
  userId: ObjectId,
  title: string,
  body: string,
  meta: {
    taskId?: ObjectId,
    projectId?: ObjectId,
    type?: string
  },
  read: boolean,
  createdAt: Date,
  updatedAt: Date,
  
  // Added by enrichment
  icon: string,           // 'bi-check2-square', 'bi-folder', etc.
  type: string            // 'task', 'project', 'notification'
}
```

---

## Common Tasks

### Mute a Project
```typescript
import { toggleProjectMute } from '../api/notifications';

await toggleProjectMute(projectId);
```

### Get Unread Count
```typescript
const { unread } = useNotifications();
// or API
api.get('/notifications/count/unread');
```

### Mark All as Read
```typescript
const { markAllAsRead } = useNotifications();
await markAllAsRead();
```

### Send Notification (Admin)
```typescript
import api from '../api/axios';

await api.post('/notifications', {
  userId: targetUserId,
  title: 'Important Update',
  body: 'Check this out',
  meta: { /* any custom data */ },
  playSoundAlert: true
});
```

### Check If Browser Supports Features
```typescript
import { isNotificationSupported, isAudioSupported } from '../utils/soundManager';

if (isNotificationSupported()) {
  // Browser supports push notifications
}

if (isAudioSupported()) {
  // Browser supports Web Audio API
}
```

---

## Browser Permissions

### Push Notifications
```typescript
import { requestNotificationPermission } from '../utils/soundManager';

// Triggers browser permission prompt
const granted = await requestNotificationPermission();
```

**Result**:
- User can grant → Uses browser notifications
- User denies → Falls back to in-app only
- Already granted → Uses immediately

### Sound
- No permission needed (uses Web Audio API)
- User controls via browser audio settings

---

## Styling

### CSS Classes
```css
.notification-card           /* Individual notification */
.notification-card.unread    /* Unread notification (highlighted) */
.notification-icon           /* Icon element */
.notification-content        /* Content wrapper */
.notification-meta           /* Meta information */
.notification-actions        /* Action buttons */
```

### Custom Styling
Edit `frontend/src/styles/notifications.css`

---

## Pagination Example

```typescript
// Frontend automatically handles pagination
// Just pass page number

const fetchNotifications = (page = 1) => {
  api.get('/notifications', { 
    params: { page, limit: 20 } 
  });
};

// Returns
{
  total: 150,
  page: 1,
  limit: 20,
  pages: 8,
  notifications: [...]
}
```

---

## Error Handling

```typescript
try {
  await markAllAsRead();
  // Success
} catch (err) {
  Swal.fire('Error', 'Failed to mark as read', 'error');
}
```

---

## Performance Tips

1. **Use pagination**: Don't load all notifications at once
2. **Lean queries**: Backend uses `.lean()` for read-only queries
3. **Mute checks**: Cached in user settings to avoid DB hits
4. **Sound manager**: Singleton pattern, no memory leaks
5. **Debounce settings**: Update settings not too frequently

---

## Debugging

### Check Real-Time Connection
```javascript
// Browser console
// Go to Network tab
// Look for WebSocket connection to Socket.IO
socket // should be connected object
```

### Check Settings Loaded
```typescript
const { settings } = useNotifications();
console.log(settings);  // Should show user preferences
```

### Test Sound Manually
```typescript
import soundManager from '../utils/soundManager';
soundManager.playNotificationPattern();  // Should hear beeps
```

### Check Notification in DB
```bash
# MongoDB
db.notifications.findOne({ userId: ObjectId("...") })
```

---

## Environment Variables (No changes needed)

The notification system works with existing `.env`:
- Uses `FRONTEND_ORIGIN` for Socket.IO CORS
- Uses `JWT_SECRET` for token verification
- Uses `MONGO_URI` for database

---

## Next: Integration Checklist

- [ ] Add to task assignment route
- [ ] Add to comment route
- [ ] Add to task status update route
- [ ] Add navigation links to UI
- [ ] Test real-time with browser
- [ ] Test sound alerts
- [ ] Test push notifications
- [ ] Test mute functionality
- [ ] Test quiet hours
- [ ] Deploy and monitor

---

**For detailed documentation, see**: `NOTIFICATION_SYSTEM.md`
**For implementation details, see**: `NOTIFICATION_IMPLEMENTATION.md`
