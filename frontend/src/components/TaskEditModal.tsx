import { useEffect, useState } from "react";
import { Modal, Form, Button, Row, Col, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import { updateTask } from "../api/tasks";
import { getAllUsers } from "../api/admin";

interface TaskEditModalProps {
  show: boolean;
  task: any;
  onHide: () => void;
  onTaskUpdated: () => void;
}

export default function TaskEditModal({
  show,
  task,
  onHide,
  onTaskUpdated,
}: TaskEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "open",
    priority: "medium",
    assigneeId: "",
    dueDate: "",
  });

  // Load users for assignee dropdown
  useEffect(() => {
    loadUsers();
  }, []);

  // Update form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "open",
        priority: task.priority || "medium",
        assigneeId: task.assigneeId?._id || task.assigneeId || "",
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [task, show]);

  async function loadUsers() {
    try {
      const res = await getAllUsers();
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }

  function handleChange(e: any) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  async function handleSubmit() {
    if (!formData.title.trim()) {
      Swal.fire("Error", "Task title is required", "error");
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        assigneeId: formData.assigneeId || null,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
      };

      await updateTask(task._id, updateData);

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Task updated successfully",
        showConfirmButton: false,
        timer: 2000,
      });

      onTaskUpdated();
      onHide();
    } catch (error: any) {
      Swal.fire(
        "Error",
        error?.response?.data?.message || "Failed to update task",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Edit Task</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          {/* Title */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-500">Title *</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
              disabled={loading}
            />
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-500">Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
              disabled={loading}
            />
          </Form.Group>

          <Row>
            {/* Status */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-500">Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Priority */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-500">Priority</Form.Label>
                <Form.Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            {/* Assignee */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-500">Assign To</Form.Label>
                <Form.Select
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Due Date */}
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-500">Due Date</Form.Label>
                <Form.Control
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Task Info */}
          {task && (
            <div
              className="p-3 bg-light rounded mb-3"
              style={{ fontSize: "12px", color: "#666" }}
            >
              <div>
                <strong>Task ID:</strong> {task._id}
              </div>
              <div>
                <strong>Created:</strong>{" "}
                {new Date(task.createdAt).toLocaleDateString()}
              </div>
              <div>
                <strong>Project:</strong>{" "}
                {task.projectId?.name || "Unknown Project"}
              </div>
            </div>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
          className="d-flex align-items-center gap-2"
        >
          {loading && (
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
          )}
          {loading ? "Updating..." : "Update Task"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
