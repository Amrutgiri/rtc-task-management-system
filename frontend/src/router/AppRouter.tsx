import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import AuthGuard from "../utils/authGuard";
import AdminGuard from "../utils/AdminGuard";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import VerifyEmail from "../pages/VerifyEmail";
import PublicGuard from "../utils/PublicGuard";
import Projects from "../pages/Projects";
import ProjectDetails from "../pages/ProjectDetails";
import Tasks from "../pages/Tasks";
import TaskDetails from "../pages/TaskDetails";
import KanbanBoard from "../pages/KanbanBoard";
import Notifications from "../pages/Notifications";
import NotificationSettings from "../pages/NotificationSettings";
import WorkLogsToday from "../pages/WorkLogs/Today";
import WorkLogsList from "../pages/WorkLogs/List";
import Reports from "../pages/Reports";
import WorkLogReports from "../pages/Reports/WorkLogReports";
import ProjectReports from "../pages/Reports/ProjectReports";
import ProductivityReports from "../pages/Reports/ProductivityReports";
import UsersAdmin from "../pages/Admin/Users";
import AdminTasks from "../pages/Admin/AdminTasks";
import AuditLogs from "../pages/Admin/AuditLogs";
import Roles from "../pages/Admin/Roles";
import BulkImport from "../pages/Admin/BulkImport";
import SystemHealth from "../pages/Admin/SystemHealth";
import Analytics from "../pages/Admin/Analytics";
import ProjectsAdmin from "../pages/Admin/Projects";
import Logs from "../pages/Admin/Logs";
import NotificationsAdmin from "../pages/Admin/Notifications";
import Settings from "../pages/Admin/Settings";
import Profile from "../pages/Profile";
import { useAuth } from "../hooks/useAuth";
import { Spinner } from "react-bootstrap";

export default function AppRouter() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)",
        }}
      >
        <div className="text-center text-white">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicGuard><Login /></PublicGuard>} />
        <Route path="/login" element={<PublicGuard><Login /></PublicGuard>} />
        <Route path="/register" element={<PublicGuard><Register /></PublicGuard>} />
        <Route path="/forgot-password" element={<PublicGuard><ForgotPassword /></PublicGuard>} />
        <Route path="/reset-password" element={<PublicGuard><ResetPassword /></PublicGuard>} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />

        <Route
          path="/projects"
          element={
            <AuthGuard>
              <Projects />
            </AuthGuard>
          }
        />

        <Route
          path="/projects/:id"
          element={
            <AuthGuard>
              <ProjectDetails />
            </AuthGuard>
          }
        />

        <Route
          path="/tasks"
          element={
            <AuthGuard>
              <Tasks />
            </AuthGuard>
          }
        />

        <Route
          path="/tasks/:id"
          element={
            <AuthGuard>
              <TaskDetails />
            </AuthGuard>
          }
        />

        <Route
          path="/kanban"
          element={
            <AuthGuard>
              <KanbanBoard />
            </AuthGuard>
          }
        />

        <Route
          path="/notifications"
          element={
            <AuthGuard>
              <Notifications />
            </AuthGuard>
          }
        />

        <Route
          path="/notification-settings"
          element={
            <AuthGuard>
              <NotificationSettings />
            </AuthGuard>
          }
        />

        <Route
          path="/profile"
          element={
            <AuthGuard>
              <Profile />
            </AuthGuard>
          }
        />

        {/* Work Logs Routes */}
        <Route
          path="/worklogs/today"
          element={
            <AuthGuard>
              <WorkLogsToday />
            </AuthGuard>
          }
        />

        <Route
          path="/worklogs/list"
          element={
            <AuthGuard>
              <WorkLogsList />
            </AuthGuard>
          }
        />

        {/* Reports Routes */}
        <Route
          path="/reports"
          element={
            <AuthGuard>
              <Reports />
            </AuthGuard>
          }
        />

        <Route
          path="/reports/worklogs"
          element={
            <AuthGuard>
              <WorkLogReports />
            </AuthGuard>
          }
        />

        <Route
          path="/reports/projects"
          element={
            <AuthGuard>
              <ProjectReports />
            </AuthGuard>
          }
        />

        <Route
          path="/reports/productivity"
          element={
            <AuthGuard>
              <ProductivityReports />
            </AuthGuard>
          }
        />

        {/* Admin Routes - Protected */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminGuard>
              <Analytics />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminGuard>
              <UsersAdmin />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/tasks"
          element={
            <AdminGuard>
              <AdminTasks />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/projects"
          element={
            <AdminGuard>
              <ProjectsAdmin />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminGuard>
              <Analytics />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <AdminGuard>
              <Logs />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/audit"
          element={
            <AdminGuard>
              <AuditLogs />
            </AdminGuard>
          }
        />
        <Route
          path="/admin/notifications"
          element={
            <AdminGuard>
              <NotificationsAdmin />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <AdminGuard>
              <Settings />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/roles"
          element={
            <AdminGuard>
              <Roles />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/import"
          element={
            <AdminGuard>
              <BulkImport />
            </AdminGuard>
          }
        />

        <Route
          path="/admin/health"
          element={
            <AdminGuard>
              <SystemHealth />
            </AdminGuard>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}
