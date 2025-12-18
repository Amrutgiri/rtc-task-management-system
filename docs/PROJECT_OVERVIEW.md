# TMS (Task Management System) - Project Overview

## Project Structure
**Tech Stack**: MERN (MongoDB + Express + React + Node.js)
- **Backend**: Node.js + Express, runs on PORT 3232
- **Frontend**: React 19 + TypeScript + Vite, with Bootstrap 5 UI
- **Real-time**: Socket.IO for notifications
- **File Storage**: Cloudinary for image/file uploads
- **Auth**: JWT tokens (8-hour expiry)
- **Database**: MongoDB via Mongoose

---

## BACKEND ARCHITECTURE

### Project Structure
```
backend/
├── server.js           (Entry point, Express app setup, route mounting)
├── socket.js           (Socket.IO initialization and handlers)
├── package.json        (Dependencies: mongoose, bcryptjs, cloudinary, socket.io, etc.)
├── middleware/
│   ├── auth.js        (authMiddleware, adminOnly)
│   ├── errorHandler.js
│   ├── upload.js      (Cloudinary upload config)
│   └── validate.js    (Express-validator error handler)
├── models/
│   ├── User.js        (name, email, passwordHash, role, avatar, active)
│   ├── Project.js     (name, description, key, ownerId, members, status, taskCount)
│   ├── Task.js        (title, description, projectId, assigneeId, status, priority, taskDate, attachments)
│   ├── Comment.js     (content, taskId, userId, attachments, reactions, deleted)
│   ├── Notification.js (userId, title, body, meta, read)
│   └── WorkLog.js     (userId, taskId, date, timeStarted, timeEnded, durationMinutes, notes)
├── routes/
│   ├── auth.js        (POST /login - email, password)
│   ├── users.js       (User management CRUD)
│   ├── projects.js    (Project CRUD, member management)
│   ├── tasks.js       (Task CRUD within projects)
│   ├── comments.js    (Comments on tasks, reactions)
│   ├── notifications.js (Get, mark as read)
│   ├── worklogs.js    (Time tracking)
│   ├── admin.js       (Admin functions)
│   └── analytics.js   (Analytics endpoints)
└── utils/
    ├── db.js          (MongoDB connection via mongoose)
    └── cloudinary.js  (File upload configuration)
```

### Key Models & Schemas

**User Model**:
- Fields: name, email, passwordHash, role (admin/manager/developer), active, avatar, passwordChangedAt
- Methods: `toJSON()` - hides passwordHash and __v
- Indexes: email is unique, lowercase, indexed

**Project Model**:
- Fields: name, description, key (unique project code), ownerId (admin ref), members[], status (active/archived), taskCount
- Relationships: ownerId refs User, members refs User[]
- Indexes on: name, key, ownerId, status

**Task Model**:
- Fields: title, description, projectId, assigneeId, status (open/in-progress/review/completed), priority (low/medium/high), taskDate, attachments[]
- Attachments: {url, fileName}
- Relationships: projectId refs Project, assigneeId refs User
- Indexes on: projectId, assigneeId, status, priority, taskDate

**Comment Model**:
- Fields: content, taskId, userId, attachments[], reactions {like[], dislike[]}, deleted (soft delete), timestamps
- Relationships: taskId refs Task, userId refs User
- Methods: `toJSON()` hides __v

**Notification Model**:
- Fields: userId, title, body, meta (mixed), read, timestamps
- Static Method: `Notification.send(userId, {title, body, meta})` - creates + emits via Socket.IO

**WorkLog Model**:
- Fields: userId, taskId, date, timeStarted, timeEnded, durationMinutes, notes
- Used for time tracking on tasks

### Authentication & Authorization

**Auth Middleware** (`authMiddleware`):
- Extracts JWT from `Authorization: Bearer <token>`
- Normalizes user object: `{id, email, name, role}`
- Sets `req.user` for downstream handlers
- Returns 401 if invalid/missing

**Admin Check** (`adminOnly`):
- Checks `req.user.role === 'admin'`
- Returns 403 if not admin

**JWT Payload Structure**:
```javascript
{
  id: user._id,
  email: user.email,
  name: user.name,
  role: user.role,
  expiresIn: '8h'
}
```

### Route Patterns

**Convention**:
- All protected routes require `authMiddleware`
- Admin-only routes require `adminOnly` middleware
- Request validation via `express-validator` body() checks
- All validation errors pass through `validate` middleware
- Error handling via `next(err)` to global errorHandler

**Example Route Structure**:
```javascript
router.post('/', authMiddleware, adminOnly, [
  body('fieldName').validation().withMessage('Error msg'),
], validate, async (req, res, next) => {
  try {
    // handler logic
  } catch (err) {
    next(err);
  }
});
```

### Server Setup (server.js)

```javascript
// Middleware
- helmet() - security headers
- morgan('dev') - request logging
- express.json() - parse JSON
- CORS with origin from env var
- Socket.IO initialized on HTTP server

// Route mounting
- /auth - authentication
- /users - user management
- /projects - projects
- /tasks - tasks
- /comments - comments
- /notifications - notifications

// Health check
GET / -> {ok: true}

// Global error handler middleware
app.use(errorHandler)

// Start
connect().then(() => server.listen(PORT))
```

### Socket.IO Integration (socket.js)

**Connection Handlers**:
- `socket.on('join', token)` - Join user room `user_${userId}` with JWT auth
- `socket.on('auth', token)` - Alternative auth handler
- `socket.on('join-task', taskId)` - Join task room `task_${taskId}` for real-time updates

**Notification Emission**:
- `Notification.send(userId, data)` emits to `user_${userId}` with event 'notification'

---

## FRONTEND ARCHITECTURE

### Project Structure
```
frontend/
├── src/
│   ├── main.tsx        (Entry point, mounts App)
│   ├── App.tsx         (Provider setup: AuthProvider > NotificationProvider > AppRouter)
│   ├── router/
│   │   └── AppRouter.tsx (Route definitions with guards)
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Projects.tsx
│   │   ├── ProjectDetails.tsx
│   │   ├── Tasks.tsx
│   │   ├── TaskDetails.tsx
│   │   ├── NotFound.tsx
│   │   ├── Admin/
│   │   │   ├── Analytics.tsx
│   │   │   ├── ProjectsList.tsx
│   │   │   ├── ProjectEdit.tsx
│   │   │   ├── UsersList.tsx
│   │   │   ├── UserEdit.tsx
│   │   │   ├── Projects.tsx
│   │   │   └── Logs.tsx
│   │   └── WorkLogs/
│   │       ├── Today.tsx
│   │       └── List.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Sidebar.css
│   │   ├── TaskCard.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationsDropdown.tsx
│   ├── context/
│   │   ├── AuthContext.tsx (user, login(email, password), logout)
│   │   └── NotificationContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useNotifications.ts
│   ├── api/
│   │   ├── axios.ts (axios instance with Bearer token interceptor)
│   │   ├── auth.ts (empty)
│   │   ├── comments.ts
│   │   ├── notifications.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   ├── layout/
│   │   └── MainLayout.tsx
│   ├── utils/
│   │   ├── authGuard.tsx (Redirect to login if no user)
│   │   ├── PublicGuard.tsx (Redirect to dashboard if user exists)
│   │   └── storage.ts
│   └── styles/
│       ├── kanban.css
│       └── comment.css
```

### Core Providers & Context

**AuthContext.tsx**:
- Context exports: `AuthContext`
- Provider: `AuthProvider` with children
- State: `user` (null or {id, name, email})
- Functions:
  - `login(email, password)` - POST /auth/login, stores token in localStorage, sets user
  - `logout()` - clears token & user from storage
- Token stored in: `localStorage.getItem("token")`

**NotificationContext.tsx**:
- For real-time notifications via Socket.IO

### API Layer (axios.ts)

```typescript
const api = axios.create({
  baseURL: "http://localhost:3232",
});

// Auto-add Bearer token from localStorage to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Route Guards

**AuthGuard** (authGuard.tsx):
- Wraps protected routes
- Redirects to `/login` if no user in AuthContext

**PublicGuard** (PublicGuard.tsx):
- Wraps public routes (Login, Register)
- Redirects to `/dashboard` if user already exists

### UI & Styling

- **Framework**: Bootstrap 5 + React-Bootstrap
- **Icons**: Bootstrap Icons (bi-*)
- **Drag & Drop**: @hello-pangea/dnd (for Kanban)
- **Alerts**: SweetAlert2
- **Custom CSS**:
  - `kanban.css` - Kanban board styling
  - `comment.css` - Comment section styling
  - `Sidebar.css` - Sidebar component styling

### Component Patterns

**Typical Page Structure**:
1. Use `useAuth()` to get user context
2. Use `useNotifications()` for real-time updates
3. Call API via `api.get/post/patch/delete()`
4. Render with Bootstrap components
5. Show alerts via SweetAlert2

---

## KEY CONVENTIONS & PATTERNS

### Backend
1. **Route File Pattern**:
   - Import models, middleware, validators
   - Define routes with `authMiddleware, adminOnly, validation, validate`
   - Use try-catch with `next(err)` for errors
   - Return `.json()` responses

2. **Error Handling**:
   - All errors passed via `next(err)` to errorHandler middleware
   - Validation errors caught by `validate` middleware
   - 401 for auth failures, 403 for forbidden, 400 for validation, 500 for server errors

3. **API Response Format**:
   - Success: `res.json(data)` or `res.json({success: true, data})`
   - Error validation: `{success: false, message, errors: []}`
   - Auth error: `{message: "Unauthorized"}` (401)

4. **Database Queries**:
   - Use `.populate()` to fetch referenced documents
   - Use `.lean()` for read-only queries (faster)
   - Use `.exec()` or `await` for promise handling

5. **Socket.IO Usage**:
   - Emit notifications via `Notification.send(userId, {title, body, meta})`
   - Gets emitted to `user_${userId}` room automatically

### Frontend
1. **Page Component Pattern**:
   - Get auth via `useAuth()` from context
   - Get notifications via `useNotifications()`
   - Fetch data via `api.*()` calls
   - Show errors via SweetAlert2
   - Render with Bootstrap/React-Bootstrap components

2. **Context Usage**:
   - AuthContext for user state & login/logout
   - NotificationContext for real-time notifications
   - Custom hooks (useAuth, useNotifications) wrap context access

3. **API Call Pattern**:
   - `import api from "../api/axios"`
   - `api.get/post/patch/delete(endpoint).then().catch()`
   - Token automatically added by interceptor

4. **Routing**:
   - Protected routes wrapped in `<AuthGuard>`
   - Public routes wrapped in `<PublicGuard>`
   - Params accessed via `useParams()`

---

## Environment Variables Needed

**Backend (.env)**:
```
MONGO_URI=mongodb://...
JWT_SECRET=your-secret-key
PORT=3232
FRONTEND_ORIGIN=http://localhost:5173 (or production URL)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Frontend (.env / hardcoded)**:
- API base URL: `http://localhost:3232` (in axios.ts)

---

## Database Relationships

```
User
├─ Projects (as ownerId) -> Project
├─ Projects (as member) -> Project.members
├─ Tasks (as assigneeId) -> Task
├─ Comments -> Comment
└─ WorkLogs -> WorkLog

Project
├─ User (ownerId) <- 1:1
├─ Users (members) <- 1:Many
└─ Tasks (projectId) <- 1:Many

Task
├─ Project (projectId) <- Many:1
├─ User (assigneeId) <- Many:1
├─ Comments (taskId) <- 1:Many
└─ WorkLogs (taskId) <- 1:Many

Comment
├─ Task (taskId) <- Many:1
└─ User (userId) <- Many:1

Notification
└─ User (userId) <- Many:1

WorkLog
├─ User (userId) <- Many:1
└─ Task (taskId) <- Many:1 (optional)
```

---

## Key Features Summary

✅ **Authentication**: JWT-based login/register with role-based access (admin/manager/developer)
✅ **Project Management**: Create, update, archive projects; manage team members
✅ **Task Management**: Create tasks, assign, set priority/status, add due dates
✅ **Comments & Reactions**: Comment on tasks with file attachments, like/dislike reactions
✅ **Real-time Notifications**: Socket.IO for instant notification delivery
✅ **Time Tracking**: WorkLog module for tracking time spent on tasks
✅ **File Uploads**: Cloudinary integration for avatar and attachment uploads
✅ **Admin Panel**: User management, project oversight, analytics, logs
✅ **Responsive UI**: Bootstrap 5 with mobile-friendly design
✅ **Security**: Helmet headers, password hashing (bcryptjs), JWT auth

---

## Important Notes for Module Creation

When creating a new module:

1. **Backend**:
   - Create model in `models/`
   - Create route in `routes/`
   - Import route in `server.js` and mount at `app.use()`
   - Use existing middleware patterns (authMiddleware, adminOnly, validate)
   - Always use try-catch with `next(err)`

2. **Frontend**:
   - Create API file in `api/` with axios calls
   - Create pages in `pages/` for main views
   - Create components in `components/` for reusable UI
   - Use `useAuth()` for user context
   - Wrap protected pages in `<AuthGuard>`
   - Add routes to `AppRouter.tsx`

3. **Validation**:
   - Backend: Use `express-validator` with body() checks
   - Frontend: Show errors via SweetAlert2

4. **Real-time Updates**:
   - Use Socket.IO for notifications
   - Emit via `Notification.send()`
   - Listen in frontend NotificationContext

