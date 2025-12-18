import { useEffect, useState } from "react";
import { Card, Row, Col, Button, Modal, Form, InputGroup, Alert, Badge } from "react-bootstrap";
import Swal from "sweetalert2";
import MainLayout from "../layout/MainLayout";
import { getProjects, createProject, deleteProject } from "../api/projects";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface Project {
  _id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  members: Array<{ _id: string; name: string }>;
  taskCount: number;
  createdAt: string;
}

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    const res = await getProjects();
    setProjects(res.data.data || []);
  }

  async function handleCreate() {
    if (!projectName) return;

    if (!isAdmin) {
      Swal.fire("Error", "Only admins can create projects", "error");
      return;
    }

    try {
      await createProject({
        name: projectName,
        description,
        key: projectName.replace(/\s+/g, "_").toUpperCase(),
      });

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Project created successfully",
        showConfirmButton: false,
        timer: 2000,
      });

      setProjectName("");
      setDescription("");
      setShowModal(false);
      loadProjects();
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to create project", "error");
    }
  }

  async function handleDelete(id: string) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This project will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteProject(id);

        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Project deleted successfully",
          showConfirmButton: false,
          timer: 2000,
        });

        loadProjects();
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Delete Failed",
          text: "Unable to delete project. Try again.",
        });
      }
    }
  }

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    return status === "active" ? "success" : "warning";
  };

  return (
    <MainLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">Projects</h3>

        {isAdmin ? (
          <Button className="rounded-pill" onClick={() => setShowModal(true)}>
            + Create Project
          </Button>
        ) : (
          <Alert variant="info" className="mb-0">
            <small>Only admins can create projects</small>
          </Alert>
        )}
      </div>

      {!isAdmin && (
        <Alert variant="warning" className="mb-4">
          <strong>Note:</strong> You can only view projects you're assigned to. Contact an admin to create or edit projects.
        </Alert>
      )}

      {/* Filters */}
      <Row className="mb-4">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button variant="outline-secondary">
              <i className="bi bi-search"></i>
            </Button>
          </InputGroup>
        </Col>
        <Col md={6}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Form.Select>
        </Col>
      </Row>

      <Row>
        {filteredProjects.length === 0 && (
          <Col xs={12}>
            <h5 className="text-muted text-center py-5">No Projects Found</h5>
          </Col>
        )}

        {filteredProjects.map((project) => (
          <Col md={4} key={project._id} className="mb-3">
            <Card className="shadow-sm h-100 d-flex flex-column">
              <Card.Body className="d-flex flex-column flex-grow-1">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h5 className="fw-bold flex-grow-1">{project.name}</h5>
                  <Badge bg={getStatusColor(project.status)} className="ms-2">
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                </div>

                <p className="text-muted flex-grow-1 mb-3">{project.description || "No description"}</p>

                <div className="d-flex gap-2 mb-3">
                  <Badge bg="info">Members: {project.members?.length || 0}</Badge>
                  <Badge bg="primary">Tasks: {project.taskCount || 0}</Badge>
                </div>

                <small className="text-muted d-block mb-3">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </small>

                <div className="d-flex justify-content-between gap-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="flex-grow-1"
                    onClick={() => navigate(`/projects/${project._id}`)}
                  >
                    View Details
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(project._id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Create Project Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Project</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Project Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Project description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button className="rounded-pill" onClick={handleCreate}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    </MainLayout>
  );
}
