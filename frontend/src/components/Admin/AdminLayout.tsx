import { ReactNode, useState } from "react";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import "../../styles/admin-layout.css";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="admin-wrapper">
      <AdminNavbar onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />
      <AdminSidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      <div className="admin-content-wrapper">
        <header className="content-header">
          <h1 className="content-title">{title}</h1>
        </header>
        <main className="admin-content">
          {children}
        </main>
        <footer className="admin-footer">
          <div className="footer-content">
            <p>&copy; 2025 Task Management System. All rights reserved.</p>
            <div className="footer-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#support">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
