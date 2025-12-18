import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationContext } from "../context/NotificationContext";
import { Button } from "react-bootstrap";

export default function NotificationBell() {
  const { unread } = useContext(NotificationContext);
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/notifications");
  };

  return (
    <Button
      variant="outline-light"
      className="position-relative border-0 p-0"
      onClick={handleClick}
      title="View notifications"
      style={{ fontSize: '1.5rem' }}
    >
      <i className="bi bi-bell-fill"></i>

      {unread > 0 && (
        <span className="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Button>
  );
}

