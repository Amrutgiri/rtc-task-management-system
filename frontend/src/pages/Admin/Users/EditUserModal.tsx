import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Spinner, Alert } from "react-bootstrap";
import Swal from "sweetalert2";
import { updateUser, type User, type UpdateUserPayload } from "../../../api/admin";

interface EditUserModalProps {
  show: boolean;
  user: User | null;
  onHide: () => void;
  onUserUpdated: () => void;
}

export default function EditUserModal({
  show,
  user,
  onHide,
  onUserUpdated,
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "developer",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form when user changes
  useEffect(() => {
    if (show && user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
      });
      setErrors({});
      setHasChanges(false);
    }
  }, [show, user]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target as HTMLInputElement | HTMLSelectElement;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Check if there are changes from original
    if (user) {
      const changed =
        formData.name !== user.name ||
        formData.email !== user.email ||
        formData.role !== user.role;
      setHasChanges(changed);
    }

    // Clear error for this field
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

      const payload: UpdateUserPayload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role as "admin" | "manager" | "developer",
      };

      if (!user) return;
      await updateUser(user._id, payload);

      Swal.fire("Success", "User updated successfully", "success");
      onUserUpdated();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to update user";

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

  function handleClose() {
    setErrors({});
    onHide();
  }

  return (
    <Modal show={show} onHide={handleClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>✏️ Edit User: {user?.name || ""}</Modal.Title>
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

          <Form.Group className="mb-4">
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
            <Form.Label className="fw-600">Account Status</Form.Label>
            <Form.Check
              type="switch"
              label={user?.active ? "✅ Active" : "❌ Inactive"}
              checked={user?.active || false}
              disabled
            />
            <Form.Text className="text-muted d-block mt-2">
              Use the Deactivate/Activate button in the Users list to change status
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
              variant="primary"
              type="submit"
              disabled={loading || !hasChanges}
              className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
            >
              {loading && <Spinner size="sm" animation="border" />}
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
