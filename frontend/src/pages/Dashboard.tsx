import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import MainLayout from "../layout/MainLayout";
import { Card, Row, Col, ListGroup, Badge, ProgressBar, Spinner } from "react-bootstrap";
import { useAuth } from "../hooks/useAuth";
import "../styles/dashboard.css";

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  taskDate?: string;
  projectId?: { name: string };
  assigneeId?: { _id: string; name: string };
}

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  taskDate?: string;
  projectId?: { name: string };
  assigneeId?: { _id: string; name: string };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myTasks: 0,
    myProjects: 0,
    completedThisWeek: 0,
    pendingNotifications: 0,
  });

  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<Task[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState({
    open: 0,
    "in-progress": 0,
    review: 0,
    completed: 0,
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  async function loadDashboardData() {
    try {
      setLoading(true);

      const res = await api.get("/dashboard");
      const data = res.data;

      setStats(data.stats);
      setTasksByStatus(data.tasksByStatus);
      setRecentActivity(data.recentActivity);
      setUpcomingDeadlines(data.upcomingDeadlines);
      setMyTasks(data.recentActivity); // Use recent activity for "My Recent Tasks" list too, or create separate if needed. 
      // Actually "My Recent Tasks" in UI is list of tasks. recentActivity is sorted by updated.
      // upcoming is sorted by date.

    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, string> = {
      open: "secondary",
      "in-progress": "primary",
      review: "warning",
      completed: "success",
    };
    return <Badge bg={variants[status] || "secondary"}>{status.replace("-", " ")}</Badge>;
  }

  function getPriorityBadge(priority: string) {
    const variants: Record<string, string> = {
      low: "info",
      medium: "warning",
      high: "danger",
    };
    return <Badge bg={variants[priority] || "secondary"}>{priority}</Badge>;
  }

  function getDaysUntil(dateString: string) {
    const today = new Date();
    const dueDate = new Date(dateString);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return <Badge bg="danger">Overdue</Badge>;
    if (diffDays === 0) return <Badge bg="warning">Today</Badge>;
    if (diffDays === 1) return <Badge bg="info">Tomorrow</Badge>;
    return <Badge bg="secondary">{diffDays} days</Badge>;
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
          <Spinner animation="border" variant="primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="dashboard-container">
        <h3 className="mb-4 fw-bold">
          Welcome back, {user?.name}! 👋
        </h3>

        {/* Quick Stats Cards */}
        <Row className="mb-4 g-3">
          <Col md={3} sm={6}>
            <Card className="stat-card shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="stat-icon bg-primary bg-opacity-10 text-primary mb-3">
                  <i className="bi bi-list-task fs-3"></i>
                </div>
                <h2 className="fw-bold mb-1">{stats.myTasks}</h2>
                <p className="text-muted mb-0">My Tasks</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3} sm={6}>
            <Card className="stat-card shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="stat-icon bg-success bg-opacity-10 text-success mb-3">
                  <i className="bi bi-check-circle fs-3"></i>
                </div>
                <h2 className="fw-bold mb-1">{stats.completedThisWeek}</h2>
                <p className="text-muted mb-0">Completed This Week</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3} sm={6}>
            <Card className="stat-card shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="stat-icon bg-info bg-opacity-10 text-info mb-3">
                  <i className="bi bi-folder fs-3"></i>
                </div>
                <h2 className="fw-bold mb-1">{stats.myProjects}</h2>
                <p className="text-muted mb-0">Active Projects</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={3} sm={6}>
            <Card className="stat-card shadow-sm h-100">
              <Card.Body className="text-center">
                <div className="stat-icon bg-warning bg-opacity-10 text-warning mb-3">
                  <i className="bi bi-bell fs-3"></i>
                </div>
                <h2 className="fw-bold mb-1">{stats.pendingNotifications}</h2>
                <p className="text-muted mb-0">Notifications</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Task Status Overview */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="fw-bold mb-0">My Tasks Overview</h5>
              </Card.Header>
              <Card.Body>
                <Row className="g-3">
                  <Col md={3} sm={6}>
                    <div className="text-center p-3 border rounded">
                      <h4 className="text-secondary mb-1">{tasksByStatus.open}</h4>
                      <small className="text-muted">Open</small>
                    </div>
                  </Col>
                  <Col md={3} sm={6}>
                    <div className="text-center p-3 border rounded">
                      <h4 className="text-primary mb-1">{tasksByStatus["in-progress"]}</h4>
                      <small className="text-muted">In Progress</small>
                    </div>
                  </Col>
                  <Col md={3} sm={6}>
                    <div className="text-center p-3 border rounded">
                      <h4 className="text-warning mb-1">{tasksByStatus.review}</h4>
                      <small className="text-muted">In Review</small>
                    </div>
                  </Col>
                  <Col md={3} sm={6}>
                    <div className="text-center p-3 border rounded">
                      <h4 className="text-success mb-1">{tasksByStatus.completed}</h4>
                      <small className="text-muted">Completed</small>
                    </div>
                  </Col>
                </Row>

                {stats.myTasks > 0 && (
                  <div className="mt-4">
                    <div className="d-flex justify-content-between mb-2">
                      <small className="text-muted">Completion Progress</small>
                      <small className="text-muted">
                        {Math.round((tasksByStatus.completed / stats.myTasks) * 100)}%
                      </small>
                    </div>
                    <ProgressBar
                      now={(tasksByStatus.completed / stats.myTasks) * 100}
                      variant="success"
                      style={{ height: "8px" }}
                    />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          {/* Upcoming Deadlines */}
          <Col md={6}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-calendar-event me-2"></i>
                  Upcoming Deadlines
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {upcomingDeadlines.length > 0 ? (
                  <ListGroup variant="flush">
                    {upcomingDeadlines.map((task) => (
                      <ListGroup.Item
                        key={task._id}
                        className="task-item"
                        onClick={() => navigate(`/tasks/${task._id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="fw-bold mb-1">{task.title}</div>
                            <small className="text-muted">
                              {task.projectId?.name || "No Project"}
                            </small>
                          </div>
                          <div className="text-end">
                            {task.taskDate && getDaysUntil(task.taskDate)}
                          </div>
                        </div>
                        <div className="mt-2">
                          {getStatusBadge(task.status)} {getPriorityBadge(task.priority)}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-calendar-check fs-1 d-block mb-2"></i>
                    No upcoming deadlines
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* My Tasks */}
          <Col md={6}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-list-check me-2"></i>
                  My Recent Tasks
                </h5>
                <a href="/tasks" className="btn btn-sm btn-outline-primary">
                  View All
                </a>
              </Card.Header>
              <Card.Body className="p-0">
                {myTasks.length > 0 ? (
                  <ListGroup variant="flush">
                    {myTasks.map((task) => (
                      <ListGroup.Item
                        key={task._id}
                        className="task-item"
                        onClick={() => navigate(`/tasks/${task._id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="fw-bold">{task.title}</div>
                          {getStatusBadge(task.status)}
                        </div>
                        <div className="d-flex gap-2">
                          {getPriorityBadge(task.priority)}
                          <small className="text-muted">
                            {task.projectId?.name || "No Project"}
                          </small>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                    No tasks assigned to you
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Recent Activity */}
          <Col md={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-activity me-2"></i>
                  Recent Activity
                </h5>
              </Card.Header>
              <Card.Body className="p-0">
                {recentActivity.length > 0 ? (
                  <ListGroup variant="flush">
                    {recentActivity.map((task) => (
                      <ListGroup.Item
                        key={task._id}
                        className="task-item"
                        onClick={() => navigate(`/tasks/${task._id}`)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="flex-grow-1">
                            <div className="fw-bold mb-1">{task.title}</div>
                            <small className="text-muted">
                              {task.projectId?.name || "No Project"} •
                              Updated {new Date(task.updatedAt).toLocaleDateString()}
                            </small>
                          </div>
                          <div className="d-flex gap-2">
                            {getStatusBadge(task.status)}
                            {getPriorityBadge(task.priority)}
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <div className="text-center text-muted py-5">
                    <i className="bi bi-clock-history fs-1 d-block mb-2"></i>
                    No recent activity
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
