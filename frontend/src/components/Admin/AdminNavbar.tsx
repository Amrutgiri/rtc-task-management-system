import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Bell, LogOut, User, Menu } from "lucide-react";
import { Dropdown } from "react-bootstrap";
import { useNotifications } from "../../hooks/useNotifications";
import "../../styles/admin-navbar.css";

import { useAuth } from "../../hooks/useAuth";

interface AdminNavbarProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export default function AdminNavbar({ onMenuToggle, sidebarOpen }: AdminNavbarProps) {
  const { user, logout } = useAuth();
  const { notifications, unread, markAllAsRead, markAsRead } = useNotifications();
  const navigate = useNavigate();

  // Show only UNREAD notifications (latest 5)
  const displayNotifications = notifications.filter((n: any) => !n.read).slice(0, 5);

  const handleLogout = async () => {
    const confirmed = await Swal.fire({
      title: "Logout",
      text: "Are you sure you want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, Logout",
    });

    if (confirmed.isConfirmed) {
      logout();
      navigate("/login");
    }
  };

  return (
    <nav className="admin-navbar">
      <div className="navbar-container">
        {/* Left Section */}
        <div className="navbar-left">
          <button
            className="menu-toggle"
            onClick={onMenuToggle}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <Menu size={24} />
          </button>
          <div className="navbar-brand">
            <img src="/logo.png" style={{ width: "50px" }} alt="" />
          </div>
        </div>

        {/* Right Section */}
        <div className="navbar-right">
          {/* Notifications Dropdown */}
          <Dropdown align="end">
            <Dropdown.Toggle
              as="button"
              className="navbar-icon-btn p-0 border-0 bg-transparent"
              style={{ cursor: "pointer" }}
            >
              <div className="position-relative p-2">
                <Bell size={20} />
                {unread > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow border-0 animate__animated animate__fadeIn" style={{ minWidth: "300px", maxWidth: "320px" }}>
              <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light">
                <h6 className="mb-0 fw-bold" style={{ color: '#212529' }}>Notifications</h6>
                {displayNotifications.length > 0 && (
                  <small
                    className="text-primary"
                    style={{ cursor: "pointer", fontSize: "0.8rem", textDecoration: "underline" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Clear All clicked'); // Debug
                      markAllAsRead();
                    }}
                  >
                    Clear All
                  </small>
                )}
              </div>

              <div className="notification-list" style={{ maxHeight: "300px", overflowY: "auto" }}>
                {displayNotifications.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    <p className="mb-0">No new notifications</p>
                  </div>
                ) : (
                  displayNotifications.map((notification: any) => {
                    // Determine redirect URL based on notification type/content
                    const getRedirectUrl = () => {
                      const msg = notification.message.toLowerCase();

                      console.log('Notification:', notification); // Debug

                      // Extract task ID from notification if present
                      if (notification.taskId) {
                        return `/tasks/${notification.taskId}`;
                      }

                      // Extract project ID from notification if present
                      if (notification.projectId) {
                        return `/admin/projects`;
                      }

                      // Based on message content
                      if (msg.includes('task') && msg.includes('assigned')) {
                        return '/tasks';
                      }

                      if (msg.includes('project')) {
                        return '/admin/projects';
                      }

                      if (msg.includes('user')) {
                        return '/admin/users';
                      }

                      // Default to notifications page
                      return '/admin/notifications';
                    };

                    const handleNotificationClick = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();

                      console.log('Notification clicked:', notification._id); // Debug

                      const url = getRedirectUrl();
                      console.log('Navigating to:', url); // Debug

                      markAsRead(notification._id);
                      navigate(url);
                    };

                    return (
                      <Dropdown.Item
                        key={notification._id}
                        className={`px-3 py-2 border-bottom ${!notification.read ? 'bg-light' : ''}`}
                        onClick={handleNotificationClick}
                        style={{ cursor: 'pointer', textDecoration: 'none' }}
                        as="div"
                      >
                        <div className="d-flex align-items-start">
                          <div className="flex-grow-1">
                            <p className="mb-1 small fw-500 text-truncate" style={{ maxWidth: "250px", color: '#212529' }}>
                              {notification.message}
                            </p>
                            <small style={{ fontSize: "0.7rem", color: '#6c757d' }}>
                              {new Date(notification.createdAt).toLocaleString()}
                            </small>
                          </div>
                          {!notification.read && <span className="p-1 bg-primary rounded-circle ms-2 mt-1" style={{ width: "6px", height: "6px" }}></span>}
                        </div>
                      </Dropdown.Item>
                    );
                  })
                )}
              </div>

              <div className="p-2 text-center border-top bg-light">
                <Link to="/admin/notifications" className="text-decoration-none small fw-bold text-primary d-block py-1">
                  View All Notifications
                </Link>
              </div>
            </Dropdown.Menu>
          </Dropdown>

          {/* User Dropdown */}
          <div className="user-menu ms-3">
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </div>
              )}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name || "Admin"}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            className="navbar-icon-btn logout-btn ms-2"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
