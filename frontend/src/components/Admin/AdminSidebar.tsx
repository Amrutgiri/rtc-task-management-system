import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  CheckSquare,
  Clock,
  FileCheck,
  Shield,
  Upload,
  Activity,
  Bell,
  Settings,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/admin-sidebar.css";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const isActive = (path: string) => {
    return location.pathname.includes(path);
  };

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin/dashboard",
      adminOnly: false,
    },
    {
      label: "Users",
      icon: Users,
      path: "/admin/users",
      adminOnly: true,
    },
    {
      label: "Projects",
      icon: FolderOpen,
      path: "/admin/projects",
      adminOnly: true,
    },
    {
      label: "Tasks",
      icon: CheckSquare,
      path: "/admin/tasks",
      adminOnly: true,
    },
    {
      label: "Work Logs",
      icon: Clock,
      path: "/admin/logs",
      adminOnly: true,
    },
    {
      label: "Audit Trail",
      icon: FileCheck,
      path: "/admin/audit",
      adminOnly: true,
    },
    {
      label: "Roles & Permissions",
      icon: Shield,
      path: "/admin/roles",
      adminOnly: true,
    },
    {
      label: "Bulk Import",
      icon: Upload,
      path: "/admin/import",
      adminOnly: true,
    },
    {
      label: "System Health",
      icon: Activity,
      path: "/admin/health",
      adminOnly: true,
    },
    {
      label: "Notifications",
      icon: Bell,
      path: "/admin/notifications",
      adminOnly: true,
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/admin/settings",
      adminOnly: true,
    },
  ];

  const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isOpen ? "open" : ""}`}>
        {/* Sidebar Header */}


        {/* Sidebar Menu */}
        <nav className="sidebar-menu">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`menu-item ${active ? "active" : ""}`}
                onClick={() => onClose()}
              >
                <Icon size={18} className="menu-icon" />
                <span className="menu-label">{item.label}</span>
                {active && <div className="menu-indicator"></div>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}

      </aside>
    </>
  );
}
