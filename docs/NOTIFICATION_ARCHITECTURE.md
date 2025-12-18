# 🔔 Notification System - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NOTIFICATION SYSTEM                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐        ┌──────────────────────┐  │
│  │   BACKEND (Node.js)  │        │  FRONTEND (React)    │  │
│  ├──────────────────────┤        ├──────────────────────┤  │
│  │                      │        │                      │  │
│  │ Models:             │        │ Pages:               │  │
│  │ ├─ Notification    │        │ ├─ Notifications    │  │
│  │ ├─ NotificationSet │        │ ├─ NotificationSets │  │
│  │                      │        │                      │  │
│  │ Routes:             │        │ Components:          │  │
│  │ ├─ /notifications  │        │ ├─ NotificationBell │  │
│  │ ├─ /notification-s │        │ ├─ NotificationsP.  │  │
│  │                      │        │                      │  │
│  │ Utils:              │        │ Context:             │  │
│  │ ├─ notifications.js │        │ ├─ NotificationCtx. │  │
│  │ ├─ socket.js        │        │ ├─ useNotifications │  │
│  │                      │        │                      │  │
│  └──────────────────────┘        └──────────────────────┘  │
│           │                              │                  │
│           └──────────────┬───────────────┘                  │
│                          │                                  │
│                    Socket.IO                                │
│                 Real-time Events                            │
│                          │                                  │
│           ┌──────────────┴───────────────┐                  │
│           │                              │                  │
│      ┌────▼──────┐              ┌────────▼───┐             │
│      │ MongoDB   │              │ Browser    │             │
│      │ Database  │              │ ├─ Sounds │             │
│      └───────────┘              │ ├─ Notif. │             │
│                                 │ └─ Storage│             │
│                                 └───────────┘             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Notification Flow (Create → Display)

```
1. EVENT TRIGGERED
   └─ Task assigned
   └─ Comment added
   └─ Status changed
   └─ Project updated

2. BACKEND SENDS
   NotifyTaskAssignment()
        │
        ├─> Check NotificationSettings
        │   ├─ Is user muted?
        │   ├─ Quiet hours active?
        │   └─ Frequency = 'never'?
        │
        ├─> Save to MongoDB
        │
        └─> Emit via Socket.IO
            └─ Include: { title, body, meta, playSound, sendPush }

3. FRONTEND RECEIVES
   socket.on('notification')
        │
        ├─> Play sound (if enabled)
        │   └─ soundManager.playNotificationPattern()
        │
        ├─> Show browser notification
        │   └─ new Notification(title, options)
        │
        ├─> Update Context State
        │   ├─ Add to notifications array
        │   └─ Increment unread count
        │
        └─> Update UI
            ├─ Badge updates on bell
            ├─ Page shows new notification
            └─ Animation plays

4. USER INTERACTS
   ├─ View notifications page
   ├─ Mark as read
   ├─ Mark all as read
   ├─ Delete notification
   └─ Mute task/project
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    NOTIFICATION DATA                        │
└─────────────────────────────────────────────────────────────┘

Notification Object:
{
  _id: ObjectId
  userId: ObjectId ──────────────┐
  title: string                  │
  body: string                   │
  meta: {                        │
    taskId: ObjectId             │
    projectId: ObjectId          │
    type: string                 │
  }                              │
  read: boolean                  │
  createdAt: Date                │
  updatedAt: Date                │
  icon: string (enriched)        │
  type: string (enriched)        │
}                                │
                                 │
NotificationSettings:            │
{                                │
  userId: ObjectId ──────────────┤ (references same user)
  emailNotifications: boolean    │
  pushNotifications: boolean     │
  soundAlerts: boolean           │
  mutedProjects: [ObjectId]      │
  mutedTasks: [ObjectId]         │
  mutedUsers: [ObjectId]         │
  frequency: string              │
  quietHours: { ... }            │
  notificationTypes: { ... }     │
}                                │
                                 │
Socket.IO Payload: ──────────────┘
{
  title: string
  body: string
  meta: object
  playSound: boolean       ← Respects user settings
  sendPush: boolean        ← Respects user settings
}
```

---

## API Request/Response Flow

```
CLIENT                                SERVER
   │                                    │
   │──GET /notifications───────────────>│
   │   (page=1, limit=20)              │
   │                                    │ Check auth
   │                                    │ Query DB with pagination
   │                                    │ Populate references
   │                                    │ Enrich with icons
   │<─────────{data + metadata}────────│
   │   {                               │
   │     total: 150,                  │
   │     page: 1,                     │
   │     pages: 8,                    │
   │     notifications: [...]         │
   │   }                              │
   │                                    │
   │─PATCH /notifications/:id/read──────>│
   │                                    │ Update DB
   │<──────────{updated notif}────────│
   │                                    │
   │─PATCH /notifications/mark-all/read→│
   │                                    │ Update all
   │<──────{modified: count}──────────│
   │                                    │
   │─GET /notification-settings────────>│
   │                                    │ Load user settings
   │<────────{settings object}────────│
   │                                    │
   │─PATCH /notification-settings──────>│
   │   {soundAlerts: false}             │ Update settings
   │<──────────{success}───────────────│
```

---

## State Management Flow

```
NotificationContext
    │
    ├─ State:
    │  ├─ notifications: []       (from API + real-time)
    │  ├─ unread: 0              (calculated from notifications)
    │  ├─ settings: {}           (from settings API)
    │  └─ browserNotifSupported: boolean
    │
    ├─ Effects (on mount):
    │  ├─ Load settings via API
    │  ├─ Load notifications via API
    │  ├─ Request notification permission
    │  └─ Connect Socket.IO listener
    │
    ├─ Socket Listener:
    │  └─ on('notification'):
    │      ├─ Check settings
    │      ├─ Play sound
    │      ├─ Send browser push
    │      ├─ Add to notifications array
    │      └─ Increment unread
    │
    └─ Methods:
       ├─ loadNotifications()
       ├─ loadSettings()
       ├─ markAsRead(id)
       ├─ markAllAsRead()
       ├─ deleteNotification(id)
       ├─ playSound()
       └─ sendBrowserNotification()
```

---

## User Settings Application Flow

```
User Preferences → Backend Logic → Frontend Behavior

soundAlerts: false
    └──> io.sendNotificationToUser() checks this
         └──> Sets playSound: false in payload
             └──> Frontend skips soundManager.play()

pushNotifications: false
    └──> io.sendNotificationToUser() checks this
         └──> Sets sendPush: false in payload
             └──> Frontend skips new Notification()

frequency: 'never'
    └──> io.sendNotificationToUser() returns early
         └──> No notification created/sent

quietHours: { enabled: true, start: '21:00', end: '07:00' }
    └──> io.sendNotificationToUser() checks current time
         └──> If within quiet hours, returns early
             └──> Notification saved but not sent/displayed

mutedProjects: [id1, id2]
    └──> io.sendNotificationToUser() checks meta.projectId
         └──> If in muted list, returns early
             └──> Notification blocked

mutedTasks: [id1, id2]
    └──> io.sendNotificationToUser() checks meta.taskId
         └──> If in muted list, returns early
             └──> Notification blocked

notificationTypes: { taskAssigned: false, ... }
    └──> (Implementation needed in route handlers)
         └──> When creating notification, check type
             └──> Only send if type enabled
```

---

## Real-Time Communication (Socket.IO)

```
CLIENT                 WEBSOCKET              SERVER
   │                      │                      │
   ├─ Socket connects     │                      │
   │  socket.io          │                      │
   │                      │                      │
   ├─ Emit: 'join' ──────>│──────────────────> Check JWT
   │  (token)             │   │                  Verify user
   │                      │   └─ socket.join()   Store userId
   │                      │
   │                      │    DB EVENT
   │                      │    └─ Task assigned
   │                      │       Comment created
   │                      │       Status changed
   │                      │
   │                      │    Handler:
   │                      │    ├─ Check settings
   │<─ Emit: 'notif' <────┼─────├─ Validate mutes
   │   (notification)     │     ├─ Check quiet hours
   │                      │     ├─ Check frequency
   │                      │     └─ Send via io.to(`user_${id}`)
   │
   ├─ Receive in Context
   │  socket.on('notification')
   │  ├─ Play sound
   │  ├─ Show browser notif
   │  ├─ Update state
   │  └─ UI re-renders
   │
   └─ USER ACTION
      Mark as read / Delete
         │
         ├─ API CALL (not Socket)
         │  PATCH /notifications/:id/read
         │
         └─> DB updated
             UI updated from API response
```

---

## Notification Lifecycle

```
CREATION
   Event (task assign, comment, etc)
   └─> Handler calls notifyTaskAssignment()
       └─> io.sendNotificationToUser()
           ├─> Check settings
           ├─> Save to DB
           ├─> Emit via Socket
           └─> Include sound/push flags

DELIVERY
   Socket.IO emits to user room
   └─> Frontend socket listener catches event
       ├─> Play sound (if enabled)
       ├─> Show push (if enabled)
       ├─> Add to context
       └─> Update UI

DISPLAY
   Notification displayed in UI
   ├─> Bell badge updates
   ├─> List updates in real-time
   └─> Or shown when user visits page

INTERACTION
   User can:
   ├─> Mark as read (single)
   ├─> Mark all as read
   ├─> Delete
   ├─> Mute sender
   └─> View full details

PERSISTENCE
   Saved in MongoDB
   ├─> Available anytime user logs in
   ├─> Survives page refresh
   ├─> Can be filtered/searched
   └─> Can be deleted or archived

HISTORY
   User can view:
   ├─> All notifications
   ├─> Unread only
   ├─> Read only
   ├─> By date
   └─> With pagination
```

---

## Sound Alert Flow

```
Notification arrives
    │
    ├─ Check user settings
    │  └─ soundAlerts: true?
    │
    ├─ Yes → soundManager.setEnabled(true)
    │  │
    │  └─ Play notification pattern
    │      └─ soundManager.playNotificationPattern()
    │          ├─ Try Web Audio API
    │          │  └─ Create oscillator
    │          │     ├─ Frequency 800 Hz
    │          │     ├─ Duration 150ms
    │          │     └─ Pause 200ms
    │          │        └─ Frequency 1000 Hz
    │          │           Duration 150ms
    │          │
    │          └─ Fallback: HTML5 Audio
    │             └─ Play pre-recorded audio
    │
    └─ No → Skip sound, just show visually
```

---

## Settings Mute Mechanism

```
MUTE FLOW
    User clicks "Mute" on task/project
    │
    └─> POST /notification-settings/mute-task/:id
        │
        ├─> Load user settings
        ├─> Add taskId to mutedTasks array
        ├─> Save to DB
        └─> Return updated settings
            │
            └─> Frontend updates UI
                └─> Show badge: "Muted"

ENFORCEMENT
    New notification arrives for task
    │
    └─> io.sendNotificationToUser() checks
        │
        ├─> Is meta.taskId in mutedTasks?
        │   └─> YES → Return early, don't send
        │   └─> NO → Continue processing
        │
        └─> Socket emits to user room
            (but user won't see this notification)

UNMUTE
    User clicks muted badge or "Unmute"
    │
    └─> POST /notification-settings/mute-task/:id (again)
        │
        ├─> Load user settings
        ├─> Remove taskId from mutedTasks
        ├─> Save to DB
        └─> Return updated settings
            │
            └─> Frontend updates UI
                └─> Badge removed
                    Now receives notifications again
```

---

## Browser Notification Permission Flow

```
APP START
    │
    └─ NotificationContext useEffect()
       │
       └─ requestNotificationPermission()
           │
           ├─ Check browser support
           │  └─ 'Notification' in window?
           │
           ├─ Check existing permission
           │  ├─ 'granted' → Use immediately
           │  ├─ 'denied' → Don't ask again
           │  └─ 'default' → Ask user
           │
           └─ Show browser permission prompt
              └─ USER CHOOSES
                 ├─ ✅ Allow
                 │  └─ Notification.permission = 'granted'
                 │     Future notifications will show
                 │
                 └─ ❌ Deny
                    └─ Notification.permission = 'denied'
                       No browser notifications in this session
                       (can be changed in browser settings)

WHEN NOTIFICATION ARRIVES
    │
    └─ Check permission
       ├─ 'granted' → new Notification(title, options)
       └─ Other → Skip, only show in app
```

---

## Error Handling Flow

```
API REQUEST
    │
    ├─ Try block
    │  └─ Make API call
    │     ├─ Success → Return data
    │     └─ Error → Catch block
    │
    └─ Catch block
       ├─ Log error to console
       ├─ Show SweetAlert message
       ├─ User can retry
       └─ State remains unchanged


SOCKET EVENT
    │
    └─ Listen for 'notification'
       ├─ Try to process
       │  ├─ Check settings
       │  ├─ Play sound
       │  ├─ Show push
       │  └─ Update UI
       │
       └─ Catch any error
          ├─ Log to console
          ├─ Skip that operation
          └─ Continue listening


SETTINGS UPDATE
    │
    └─ User changes setting
       ├─ Update local state
       ├─ Send to API
       │  ├─ Success → Show "Saved!"
       │  └─ Error → Revert state, show error
       │
       └─ User can try again
```

---

## Database Query Flow

```
GET /notifications?page=1&limit=20&read=false
    │
    ├─ Auth check (authMiddleware)
    │  └─ Verify JWT token
    │
    ├─ Build filter
    │  ├─ userId = req.user.id
    │  ├─ read = false (if param provided)
    │  └─ Other filters
    │
    ├─ Count total documents
    │  └─ db.notifications.countDocuments(filter)
    │
    ├─ Fetch paginated docs
    │  └─ db.notifications.find(filter)
    │     ├─ .populate('meta.taskId')
    │     ├─ .populate('meta.projectId')
    │     ├─ .sort({ createdAt: -1 })
    │     ├─ .skip((page-1) * limit)
    │     └─ .limit(limit)
    │
    ├─ Enrich with icons
    │  └─ Loop through results
    │     └─ Add icon & type fields
    │
    └─ Return paginated response
       ├─ total: count
       ├─ page: current page
       ├─ pages: total pages
       └─ notifications: array
```

---

This architecture ensures:
- ✅ Real-time delivery (Socket.IO)
- ✅ Persistent storage (MongoDB)
- ✅ User preference respect (Settings checks)
- ✅ Sound & push feedback (soundManager + Notification API)
- ✅ Scalable pagination
- ✅ Error resilience
- ✅ Security & auth
