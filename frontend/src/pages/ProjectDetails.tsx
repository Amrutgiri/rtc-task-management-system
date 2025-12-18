import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Spinner,
  Alert,
  ListGroup,
  Modal,
  Form,
  ProgressBar,
} from "react-bootstrap";
import { ArrowLeft, Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Swal from "sweetalert2";
import MainLayout from "../layout/MainLayout";
import { getProjects, updateProjectStatus, addProjectMember, removeProjectMember } from "../api/projects";
import { getTasks } from "../api/tasks";
import { getAllUsers } from "../api/admin";
import { useAuth } from "../hooks/useAuth";
import FileUpload from "../components/FileUpload";
import AttachmentList from "../components/AttachmentList";
import "../styles/file-upload.css";

interface Project {
  _id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  ownerId: { _id: string; name: string };
  members: Array<{ _id: string; name: string }>;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  projectId: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  assignedTo: { _id: string; name: string };
  dueDate: string;
  createdAt: string;
}

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState("");

  useEffect(() => {
    loadProjectDetails();
    loadUsers();
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadProjectDetails() {
    try {
      setLoading(true);
      const res = await getProjects();
      const foundProject = res.data?.find((p: Project) => p._id === id);
      if (foundProject) {
        setProject(foundProject);
      } else {
        Swal.fire("Error", "Project not found", "error");
        navigate("/projects");
      }
    } catch {
      Swal.fire("Error", "Failed to load project details", "error");
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const res = await getAllUsers();
      setUsers(res || []);
    } catch (error) {
      console.error("Load users error:", error);
    }
  }

  async function loadTasks() {
    try {
      const res = await getTasks();
      const projectTasks = res.data?.filter((task: Task) => task.projectId === id) || [];
      setTasks(projectTasks);
    } catch (error) {
      console.error("Load tasks error:", error);
    }
  }

  // Analytics Helpers
  function getTaskStats() {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === "done").length,
      inProgress: tasks.filter(t => t.status === "in-progress").length,
      todo: tasks.filter(t => t.status === "todo").length,
    };
  }

  function getCompletionPercentage() {
    const stats = getTaskStats();
    if (stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  }

  function getMemberWorkload() {
    const workload: { [key: string]: number } = {};
    project?.members.forEach(member => {
      workload[member._id] = tasks.filter(t => t.assignedTo?._id === member._id).length;
    });
    return workload;
  }

  function getTasksByPriority() {
    return {
      high: tasks.filter(t => t.priority === "high").length,
      medium: tasks.filter(t => t.priority === "medium").length,
      low: tasks.filter(t => t.priority === "low").length,
    };
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "done":
        return "success";
      case "in-progress":
        return "warning";
      case "todo":
        return "secondary";
      default:
        return "light";
    }
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "light";
    }
  }

  async function handleToggleStatus() {
    if (!project) return;

    try {
      setLoading(true);
      const newStatus = project.status === "active" ? "archived" : "active";
      await updateProjectStatus(project._id, newStatus);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Project ${newStatus}`,
        showConfirmButton: false,
        timer: 2000,
      });

      loadProjectDetails();
    } catch (error) {
      let errorMessage = "Failed to update project status";
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as Record<string, Record<string, Record<string, string>>>;
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      Swal.fire("Error", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddMember() {
    if (!project || !selectedMemberToAdd) {
      Swal.fire("Error", "Please select a member", "error");
      return;
    }

    if (project.members.some((m) => m._id === selectedMemberToAdd)) {
      Swal.fire("Error", "This member is already added", "error");
      return;
    }

    try {
      setLoading(true);
      await addProjectMember(project._id, selectedMemberToAdd);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Member added successfully",
        showConfirmButton: false,
        timer: 2000,
      });

      setSelectedMemberToAdd("");
      loadProjectDetails();
    } catch (error) {
      let errorMessage = "Failed to add member";
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as Record<string, Record<string, Record<string, string>>>;
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      Swal.fire("Error", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!project) return;

    const confirmed = await Swal.fire({
      title: "Remove Member?",
      text: "This member will be removed from the project",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Yes, Remove",
    });

    if (!confirmed.isConfirmed) return;

    try {
      setLoading(true);
      await removeProjectMember(project._id, memberId);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Member removed successfully",
        showConfirmButton: false,
        timer: 2000,
      });

      loadProjectDetails();
    } catch (error) {
      let errorMessage = "Failed to remove member";
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as Record<string, Record<string, Record<string, string>>>;
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      Swal.fire("Error", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading project details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <Alert variant="danger">Project not found</Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container>
        {/* Header */}
        <div className="d-flex align-items-center gap-3 mb-4">
          <Button
            variant="light"
            onClick={() => navigate("/projects")}
            className="d-flex align-items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back
          </Button>
          <div className="flex-grow-1">
            <div className="d-flex align-items-center gap-2 mb-2">
              <h2 className="mb-0">{project.name}</h2>
              <Badge bg={getStatusColor(project.status)}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted mb-0">{project.description || "No description"}</p>
          </div>
        </div>

        <Row className="mb-4">
          {/* Project Info */}
          <Col lg={8}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Project Information</h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="fw-500 text-muted small">Project Owner</label>
                      <div className="mt-1">
                        <Badge bg="light" text="dark">
                          {project.ownerId?.name || "Admin"}
                        </Badge>
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="fw-500 text-muted small">Status</label>
                      <div className="mt-1">
                        {isAdmin && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={handleToggleStatus}
                            disabled={loading}
                          >
                            Toggle Status
                          </Button>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="fw-500 text-muted small">Created Date</label>
                      <div className="mt-1">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="fw-500 text-muted small">Last Updated</label>
                      <div className="mt-1">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* Stats */}
            <Row className="mb-4">
              <Col sm={6}>
                <Card className="shadow-sm text-center p-3">
                  <h3 className="text-primary mb-1">{project.taskCount || 0}</h3>
                  <small className="text-muted">Total Tasks</small>
                </Card>
              </Col>
              <Col sm={6}>
                <Card className="shadow-sm text-center p-3">
                  <h3 className="text-info mb-1">{project.members?.length || 0}</h3>
                  <small className="text-muted">Team Members</small>
                </Card>
              </Col>
            </Row>

            {/* Analytics Dashboard */}
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">📊 Project Analytics</h5>
              </Card.Header>
              <Card.Body>
                {/* Completion Progress */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="fw-500 mb-0">Task Completion</label>
                    <Badge bg="primary">{getCompletionPercentage()}%</Badge>
                  </div>
                  <ProgressBar now={getCompletionPercentage()} label={`${getTaskStats().completed}/${getTaskStats().total}`} />
                </div>

                {/* Task Status Breakdown */}
                <div className="row row-cols-3 mb-4">
                  <div className="col text-center">
                    <CheckCircle size={24} className="text-success mb-2" />
                    <div className="h5 mb-0">{getTaskStats().completed}</div>
                    <small className="text-muted">Completed</small>
                  </div>
                  <div className="col text-center">
                    <Clock size={24} className="text-warning mb-2" />
                    <div className="h5 mb-0">{getTaskStats().inProgress}</div>
                    <small className="text-muted">In Progress</small>
                  </div>
                  <div className="col text-center">
                    <AlertCircle size={24} className="text-secondary mb-2" />
                    <div className="h5 mb-0">{getTaskStats().todo}</div>
                    <small className="text-muted">To Do</small>
                  </div>
                </div>

                {/* Priority Distribution */}
                <div>
                  <label className="fw-500 mb-2">Priority Distribution</label>
                  <div className="d-flex gap-2">
                    <Badge bg="danger">High: {getTasksByPriority().high}</Badge>
                    <Badge bg="warning">Medium: {getTasksByPriority().medium}</Badge>
                    <Badge bg="info">Low: {getTasksByPriority().low}</Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Member Workload Analytics */}
            {project.members.length > 0 && (
              <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">👥 Member Workload</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <ListGroup variant="flush">
                    {project.members.map((member) => {
                      const workload = getMemberWorkload()[member._id] || 0;
                      const percentage = tasks.length > 0 ? (workload / tasks.length) * 100 : 0;
                      return (
                        <ListGroup.Item key={member._id}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-500">{member.name}</span>
                            <Badge bg="info">{workload} tasks</Badge>
                          </div>
                          <ProgressBar now={percentage} style={{ height: "6px" }} />
                        </ListGroup.Item>
                      );
                    })}
                  </ListGroup>
                </Card.Body>
              </Card>
            )}
          </Col>

          {/* Members Section */}
          <Col lg={4}>
            <Card className="shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Team Members</h5>
                {isAdmin && (
                  <Button
                    variant="sm"
                    size="sm"
                    onClick={() => setShowMembersModal(true)}
                    className="d-flex align-items-center gap-1"
                  >
                    <Users size={16} />
                    Manage
                  </Button>
                )}
              </Card.Header>
              <Card.Body className="p-0">
                {project.members.length === 0 ? (
                  <div className="p-3 text-center text-muted">
                    <p className="mb-0">No members assigned yet</p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {project.members.map((member) => (
                      <ListGroup.Item
                        key={member._id}
                        className="d-flex justify-content-between align-items-center"
                      >
                        <span>{member.name}</span>
                        {isAdmin && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveMember(member._id)}
                            disabled={loading}
                          >
                            Remove
                          </Button>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* File Attachments Section */}
        <Row className="mt-4">
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">📎 File Attachments</h5>
              </Card.Header>
              <Card.Body>
                <FileUpload
                  entityId={id!}
                  entityType="project"
                  onUploadComplete={loadProjectDetails}
                />

                <hr className="my-4" />

                <AttachmentList
                  entityId={id!}
                  entityType="project"
                  onAttachmentDeleted={loadProjectDetails}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Tasks Section */}
        <Row className="mt-4">
          <Col xs={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">📋 Project Tasks ({tasks.length})</h5>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => navigate(`/tasks?projectId=${project?._id}`)}
                >
                  View All Tasks
                </Button>
              </Card.Header>
              <Card.Body>
                {tasks.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <p className="mb-0">No tasks yet. Create one to get started!</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th>Task Title</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Assigned To</th>
                          <th>Due Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.slice(0, 5).map((task) => (
                          <tr key={task._id}>
                            <td className="fw-500">{task.title}</td>
                            <td>
                              <Badge bg={getStatusColor(task.status)}>
                                {task.status.replace("-", " ").toUpperCase()}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={getPriorityColor(task.priority)}>
                                {task.priority.toUpperCase()}
                              </Badge>
                            </td>
                            <td>{task.assignedTo?.name || "Unassigned"}</td>
                            <td className="text-muted small">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate(`/tasks/${task._id}`)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {tasks.length > 5 && (
                  <div className="text-center mt-3">
                    <small className="text-muted">
                      Showing 5 of {tasks.length} tasks
                    </small>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Members Management Modal */}
        <Modal show={showMembersModal} onHide={() => setShowMembersModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Add Members</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-500">Select Member</Form.Label>
              <Form.Select
                value={selectedMemberToAdd}
                onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                disabled={loading}
              >
                <option value="">Choose a member...</option>
                {users
                  .filter((u) => !project.members.some((m) => m._id === u._id))
                  .map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowMembersModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddMember}
              disabled={loading || !selectedMemberToAdd}
            >
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </MainLayout>
  );
}
