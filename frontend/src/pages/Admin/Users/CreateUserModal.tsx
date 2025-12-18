import React, { useState } from "react";
import { Modal, Form, Button, Spinner, Alert } from "react-bootstrap";
import Swal from "sweetalert2";
import { createUser, type CreateUserPayload } from "../../../api/admin";

interface CreateUserModalProps {
  show: boolean;
  onHide: () => void;
  onUserCreated: () => void;
}

export default function CreateUserModal({
  show,
  onHide,
  onUserCreated,
}: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "developer",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload: CreateUserPayload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role as "admin" | "manager" | "developer",
        password: formData.password || undefined,
      };

      await createUser(payload);

      Swal.fire("Success", "User created successfully", "success");
      resetForm();
      onUserCreated();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to create user";
      
      if (error?.response?.data?.errors) {
        // Validation errors from backend
        const backendErrors: Record<string, string> = {};
        error.response.data.errors.forEach((err: any) => {
          backendErrors[err.param] = err.msg;
        });
        setErrors(backendErrors);
        Swal.fire("Validation Error", "Please check the form fields", "error");
      } else {
        Swal.fire("Error", message, "error");
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      email: "",
      role: "developer",
      password: "",
    });
    setErrors({});
  }

  function handleClose() {
    resetForm();
    onHide();
  }

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>✨ Create New User</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit} noValidate>
          <Form.Group className="mb-3">
            <Form.Label className="fw-600">Full Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., John Doe"
              isInvalid={!!errors.name}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.name}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-600">Email Address</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., john@example.com"
              isInvalid={!!errors.email}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
            <Form.Text className="text-muted d-block mt-1">
              Email must be unique across the system
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label className="fw-600">Role</Form.Label>
            <Form.Select
              name="role"
              value={formData.role}
              onChange={handleChange}
              isInvalid={!!errors.role}
              disabled={loading}
            >
              <option value="developer">👨‍💻 Developer</option>
              <option value="manager">👔 Manager</option>
              <option value="admin">🔐 Admin</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.role}
            </Form.Control.Feedback>
            <Form.Text className="text-muted d-block mt-1">
              <small>
                <strong>Developer:</strong> Can view/update own tasks
                <br />
                <strong>Manager:</strong> Can view all tasks and manage team
                <br />
                <strong>Admin:</strong> Full system access
              </small>
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label className="fw-600">
              Password <span className="text-muted">(Optional)</span>
            </Form.Label>
            <Form.Control
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave empty to generate temporary password"
              isInvalid={!!errors.password}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.password}
            </Form.Control.Feedback>
            <Form.Text className="text-muted d-block mt-1">
              Must be at least 6 characters
            </Form.Text>
          </Form.Group>

          {Object.keys(errors).length > 0 && (
            <Alert variant="danger" className="mb-3">
              <strong>Please fix the errors above</strong>
            </Alert>
          )}

          <div className="d-flex gap-2">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={loading}
              className="flex-grow-1"
            >
              Cancel
            </Button>
            <Button
              variant="success"
              type="submit"
              disabled={loading}
              className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
            >
              {loading && <Spinner size="sm" animation="border" />}
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
