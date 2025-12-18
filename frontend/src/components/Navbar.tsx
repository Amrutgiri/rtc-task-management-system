import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import NotificationsDropdown from "../components/NotificationsDropdown";
import ThemeToggle from "./ThemeToggle";

import { Menu } from "lucide-react"; // Import icon

interface NavbarTopProps {
  onToggleSidebar?: () => void;
}

export default function NavbarTop({ onToggleSidebar }: NavbarTopProps) {

  const { logout, user } = useAuth();
  const navigate = useNavigate();
  return (
    <nav className="d-flex justify-content-between align-items-center px-4 py-2 shadow-sm bg-white">

      <div className="d-flex align-items-center gap-3">
        {/* Mobile Toggle Button */}
        <button
          className="btn btn-link text-dark p-0 d-lg-none"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>

        <h5>Welcome {user?.name}</h5>
      </div>

      <div className="d-flex align-items-center gap-3">
        <ThemeToggle />

        <div className="position-relative">
          <NotificationsDropdown />
        </div>

        <button className="btn btn-outline-danger btn-sm" onClick={() => {
          logout();
          navigate("/login");
        }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
