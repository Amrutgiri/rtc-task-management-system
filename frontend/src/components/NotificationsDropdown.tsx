import { useContext, useState } from "react";
import { NotificationContext } from "../context/NotificationContext";
import { Dropdown, Badge, ListGroup, Button } from "react-bootstrap";

export default function NotificationsDropdown() {
  const { notifications, unread, markAsRead } = useContext(NotificationContext);
  const [open, setOpen] = useState(false);

  return (
    <Dropdown show={open} onToggle={() => setOpen(!open)} align="end">
      <Dropdown.Toggle
        variant="light"
        id="notification-bell"
        className="position-relative"
      >
        🔔
        {unread > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
          >
            {unread}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: 350 }} className="p-0 shadow">
        <div className="p-3 fw-bold border-bottom">Notifications</div>

        <ListGroup variant="flush" style={{ maxHeight: 300, overflowY: "auto" }}>
          {notifications.length === 0 && (
            <div className="text-center text-muted p-3">No notifications</div>
          )}

          {notifications.map((n: any) => (
            <ListGroup.Item
              key={n._id}
              action
              className={!n.read ? "bg-light" : ""}
              onClick={() => markAsRead(n._id)}
            >
              <div className="fw-bold">{n.title}</div>
              <div className="small text-muted">{n.body}</div>
              <div className="small text-secondary">
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Dropdown.Menu>
    </Dropdown>
  );
}
