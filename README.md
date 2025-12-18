# Task Management System (TMS)

A comprehensive MERN stack Task Management System with real-time notifications, file attachments, analytics, and role-based access control.

## 🚀 Features

### Core Functionality
- ✅ **Task Management** - Create, assign, track, and manage tasks
- ✅ **Project Management** - Organize tasks into projects
- ✅ **Kanban Board** - Visual task management with drag-and-drop
- ✅ **File Attachments** - Upload and manage files on tasks/projects (up to 10MB)
- ✅ **Real-time Notifications** - Socket.io powered live updates
- ✅ **Work Logs** - Track time spent on tasks
- ✅ **Comments** - Collaborate on tasks with threaded comments
- ✅ **Analytics Dashboard** - Comprehensive statistics and insights

### User Features
- 🔐 **Authentication** - Secure JWT-based auth
- 👥 **Role-Based Access Control** - Admin, SuperAdmin, Employee roles
- 🌓 **Dark Mode** - Full dark/light theme support
- 📱 **Mobile Responsive** - Works on all device sizes
- 🔔 **Push Notifications** - Browser push notifications with sound alerts
- 📧 **Email Notifications** - Automated email alerts for task assignments

### Admin Features
- 📊 **Admin Dashboard** - System-wide statistics
- 👤 **User Management** - Manage users and permissions
- 📈 **Analytics** - Detailed reports and insights
- 🎨 **TanStack Tables** - Advanced data tables with sorting/filtering
- 📥 **Bulk Import** - CSV import for users and tasks

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **Multer** - File upload handling
- **Nodemailer** - Email service

### Frontend
- **React 18** + **TypeScript** - UI framework
- **React Router** - Navigation
- **Bootstrap** + **React-Bootstrap** - UI components
- **Axios** - HTTP client
- **Socket.io Client** - Real-time updates
- **SweetAlert2** - Beautiful alerts
- **Lucide React** - Modern icons
- **@hello-pangea/dnd** - Drag and drop

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

## 🔧 Installation

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd TMS
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration
```

**Backend .env example:**
```env
PORT=3232
MONGO_URI=mongodb://localhost:27017/tms
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env file if needed
# Frontend uses http://localhost:3232 by default
```

### 4. Run the Application

**Development Mode:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Production Mode:**
```bash
# Build frontend
cd frontend
npm run build

# Serve with backend
cd ../backend
npm start
```

## 🔑 Default Credentials

After seeding the database (if applicable):
- **Admin:** admin@example.com / password
- **User:** user@example.com / password

## 📁 Project Structure

```
TMS/
├── backend/
│   ├── middleware/      # Auth, upload, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── uploads/         # File storage (gitignored)
│   └── server.js        # Entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/         # API integration
│   │   ├── components/  # React components
│   │   ├── context/     # Context providers
│   │   ├── hooks/       # Custom hooks
│   │   ├── layout/      # Layout components
│   │   ├── pages/       # Page components
│   │   ├── styles/      # CSS files
│   │   └── utils/       # Helper functions
│   └── package.json
│
└── README.md
```

## 🚀 Key Features Implementation

### File Attachments
- Local filesystem storage in `backend/uploads/`
- Organized by entity: `uploads/tasks/{taskId}/` and `uploads/projects/{projectId}/`
- Supports: Images, PDFs, Word, Excel, PowerPoint, Text, ZIP
- Max 5 files per upload, 10MB per file
- Download and delete with permissions

### Real-time Notifications
- Socket.io integration
- In-app notifications dropdown
- Browser push notifications (with permission)
- Sound alerts (can be toggled)
- Email notifications for task assignments

### Kanban Board
- Drag-and-drop task management
- Status columns: To Do, In Progress, Review, Completed
- Filters: Project, Date, Search
- Mobile responsive with vertical stacking
- Attachment count badges

### Analytics
- User work statistics
- Project completion tracking
- Task distribution charts
- Work log summaries
- Time tracking insights

## 🔐 Security Features

- JWT authentication with HTTP-only cookies
- Password hashing with bcrypt
- Role-based access control (RBAC)
- File type and size validation
- SQL injection prevention (MongoDB)
- XSS protection
- CORS configuration

## 📱 Mobile Responsive

- Fully responsive design
- Touch-friendly interfaces
- Mobile-optimized dropdowns and forms
- Sidebar overlay on mobile
- Prevented unwanted iOS zoom

## 🌓 Dark Mode

- Full dark/light theme support
- User preference saved in localStorage
- CSS variables for theming
- Bootstrap dark mode integration

## 🐛 Known Issues

None currently! All major features tested and working.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name

## 🙏 Acknowledgments

- React Bootstrap for UI components
- Lucide React for beautiful icons
- Socket.io for real-time features
- MongoDB team for the database
- All open-source contributors

---

**Built with ❤️ using MERN Stack**

Last Updated: December 18, 2025
