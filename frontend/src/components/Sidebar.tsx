import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Sidebar.css";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isAdminPanel = location.pathname.startsWith("/admin");

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? "show" : ""}`}
        onClick={onClose}
      />

      <div className={`sidebar shadow ${isOpen ? "open" : ""}`}>
        <div className="d-flex justify-content-between align-items-center py-3 px-3">
          <h4 className="mb-0 fw-bold mx-auto">
            {isAdminPanel ? "ADMIN PANEL" : "TMS"}
          </h4>
          {/* Close button for mobile only if needed, but overlay click works too. 
               We can add an 'X' if we want. */}
        </div>

        <ul onClick={onClose}> {/* Close sidebar when link clicked on mobile */}
          {/* USER DASHBOARD MENU - Only show when NOT in admin panel */}
          {!isAdminPanel && (
            <>
              <li>
                <Link to="/dashboard">
                  <i className="bi bi-speedometer2 me-2"></i> Dashboard
                </Link>
              </li>

              <li>
                <Link to="/projects">
                  <i className="bi bi-folder2-open me-2"></i> Projects
                </Link>
              </li>

              <li>
                <Link to="/kanban">
                  <i className="bi bi-kanban me-2"></i> Kanban Board
                </Link>
              </li>

              <li>
                <Link to="/profile">
                  <i className="bi bi-person-circle me-2"></i> My Profile
                </Link>
              </li>

              <li>
                <Link to="/notifications">
                  <i className="bi bi-bell me-2"></i> Notifications
                </Link>
              </li>

              <li className="sidebar-divider">
                <hr className="my-2" style={{ opacity: 0.3 }} />
                <div className="small text-muted text-uppercase px-3 mb-1 mt-2" style={{ fontSize: '0.75rem' }}>Work Logs</div>
              </li>

              <li>
                <Link to="/worklogs/today">
                  <i className="bi bi-clock-history me-2"></i> Today's Log
                </Link>
              </li>

              <li>
                <Link to="/worklogs/list">
                  <i className="bi bi-list-check me-2"></i> Log History
                </Link>
              </li>

              <li className="sidebar-divider">
                <hr className="my-2" style={{ opacity: 0.3 }} />
              </li>

              <li>
                <Link to="/reports">
                  <i className="bi bi-bar-chart me-2"></i> Reports
                </Link>
              </li>

              {/* Link to Admin Panel for admins */}
              {isAdmin && (
                <>
                  <li className="sidebar-divider">
                    <hr className="my-2" style={{ opacity: 0.3 }} />
                  </li>
                  <li>
                    <Link to="/admin/analytics" className="text-danger fw-semibold">
                      <i className="bi bi-gear me-2"></i> Go to Admin Panel
                    </Link>
                  </li>
                </>
              )}
            </>
          )}

          {/* ADMIN PANEL MENU - Only show when IN admin panel AND user is admin */}
          {isAdminPanel && isAdmin && (
            <>
              <li className="sidebar-divider">
                <hr className="my-2" style={{ opacity: 0.3 }} />
                <div className="small text-muted text-uppercase px-3 mb-1 mt-2" style={{ fontSize: '0.75rem' }}>Admin Panel</div>
              </li>
              <li>
                <Link to="/admin/analytics">
                  <i className="bi bi-speedometer me-2"></i> Dashboard
                </Link>
              </li>
              <li>
                <Link to="/admin/users">
                  <i className="bi bi-people me-2"></i> Users
                </Link>
              </li>
              <li>
                <Link to="/admin/logs">
                  <i className="bi bi-clock-history me-2"></i> Work Logs
                </Link>
              </li>
              <li>
                <Link to="/admin/tasks">
                  <i className="bi bi-list-task me-2"></i> Tasks
                </Link>
              </li>
              <li>
                <Link to="/admin/audit">
                  <i className="bi bi-journal-text me-2"></i> Audit Trail
                </Link>
              </li>
              <li>
                <Link to="/admin/roles">
                  <i className="bi bi-shield-lock me-2"></i> Roles & Permissions
                </Link>
              </li>
              <li>
                <Link to="/admin/notifications">
                  <i className="bi bi-bell me-2"></i> Notifications
                </Link>
              </li>
              <li>
                <Link to="/admin/projects">
                  <i className="bi bi-folder me-2"></i> Projects
                </Link>
              </li>
              <li>
                <Link to="/admin/import">
                  <i className="bi bi-file-earmark-arrow-up me-2"></i> Bulk Import
                </Link>
              </li>
              <li>
                <Link to="/admin/health">
                  <i className="bi bi-heart-pulse me-2"></i> System Health
                </Link>
              </li>
              <li>
                <Link to="/admin/settings">
                  <i className="bi bi-gear me-2"></i> Settings
                </Link>
              </li>

              {/* Back to User Dashboard */}
              <li className="sidebar-divider">
                <hr className="my-2" style={{ opacity: 0.3 }} />
              </li>
              <li>
                <Link to="/dashboard" className="text-primary fw-semibold">
                  <i className="bi bi-arrow-left me-2"></i> Back to Dashboard
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </>
  );
}
