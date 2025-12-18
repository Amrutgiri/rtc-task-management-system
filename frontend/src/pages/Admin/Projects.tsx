import { useState, useEffect, useMemo, type ChangeEvent } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  Modal,
} from "react-bootstrap";
import { type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table";
import { Edit2, Trash2, Users } from "lucide-react";
import AdminLayout from "../../components/Admin/AdminLayout";
import AdminDataTable from "../../components/Admin/AdminDataTable";
import {
  createProject,
  deleteProject,
  updateProject,
  updateProjectStatus,
  addProjectMember,
  removeProjectMember,
} from "../../api/projects";
import Swal from "sweetalert2";
import api from "../../api/axios";

interface Owner {
  _id: string;
  name: string;
}

interface Member {
  _id: string;
  name: string;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: "active" | "archived";
  ownerId: Owner;
  members: Member[];
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

export default function ProjectsAdmin() {
  // Data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);

  // Table state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true }
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = useState("");

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadProjects();
  }, [pagination, sorting, globalFilter, statusFilter]);

  async function loadProjects() {
    try {
      setLoading(true);
      const sortBy = sorting[0]?.id || "createdAt";
      const sortOrder = sorting[0]?.desc ? "desc" : "asc";

      const response = await api.get("/projects", {
        params: {
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          sortBy,
          sortOrder,
          search: globalFilter,
          status: statusFilter !== "all" ? statusFilter : undefined,
        },
      });

      setProjects(response.data.data);
      setTotalCount(response.data.totalCount);
      setPageCount(response.data.totalPages);
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to load projects", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsers() {
    try {
      const response = await api.get("/users", {
        params: { pageSize: 1000 } // Get all users for member selection
      });
      setUsers(response.data.data || []);
    } catch (error: any) {
      console.error("Failed to load users:", error);
      setUsers([]);
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  function openCreateModal() {
    setFormData({ name: "", description: "" });
    setShowCreateModal(true);
  }

  function openEditModal(project: Project) {
    setFormData({ name: project.name, description: project.description });
    setSelectedProject(project);
    setShowEditModal(true);
  }

  function openMembersModal(project: Project) {
    setSelectedProject(project);
    setShowMembersModal(true);
  }

  async function handleCreateProject() {
    if (!formData.name.trim()) {
      Swal.fire("Error", "Project name is required", "error");
      return;
    }

    try {
      await createProject({
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      Swal.fire("Success", "Project created successfully", "success");
      setShowCreateModal(false);
      await loadProjects();
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to create project", "error");
    }
  }

  async function handleUpdateProject() {
    if (!selectedProject || !formData.name.trim()) {
      Swal.fire("Error", "Project name is required", "error");
      return;
    }

    try {
      await updateProject(selectedProject._id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      Swal.fire("Success", "Project updated successfully", "success");
      setShowEditModal(false);
      setSelectedProject(null);
      await loadProjects();
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to update project", "error");
    }
  }

  async function handleToggleStatus(project: Project) {
    const newStatus = project.status === "active" ? "archived" : "active";
    try {
      await updateProjectStatus(project._id, newStatus);
      Swal.fire("Success", `Project ${newStatus === "active" ? "activated" : "archived"}`, "success");
      await loadProjects();
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to update status", "error");
    }
  }

  async function handleAddMember() {
    if (!selectedProject || !selectedMemberToAdd) {
      return;
    }

    // Check if member already exists
    if (selectedProject.members.some(m => m._id === selectedMemberToAdd)) {
      Swal.fire("Info", "User is already a member", "info");
      return;
    }

    try {
      await addProjectMember(selectedProject._id, selectedMemberToAdd);
      Swal.fire("Success", "Member added successfully", "success");
      setSelectedMemberToAdd("");
      await loadProjects();
      // Update selected project in modal
      const updated = projects.find(p => p._id === selectedProject._id);
      if (updated) setSelectedProject(updated);
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to add member", "error");
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!selectedProject) return;

    try {
      const result = await Swal.fire({
        title: "Remove Member?",
        text: "Are you sure you want to remove this member?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        confirmButtonText: "Yes, Remove",
      });

      if (result.isConfirmed) {
        await removeProjectMember(selectedProject._id, memberId);
        Swal.fire("Success", "Member removed successfully", "success");
        await loadProjects();
        // Update selected project in modal
        const updated = projects.find(p => p._id === selectedProject._id);
        if (updated) setSelectedProject(updated);
      }
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to remove member", "error");
    }
  }

  async function handleDeleteProject(project: Project) {
    try {
      const result = await Swal.fire({
        title: "Delete Project?",
        html: `Are you sure you want to delete <strong>${project.name}</strong>?<br><br><span style="color: red;">This will also delete all tasks in this project!</span>`,
        icon: "error",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        confirmButtonText: "Yes, Delete",
      });

      if (result.isConfirmed) {
        await deleteProject(project._id);
        Swal.fire("Deleted!", "Project deleted successfully", "success");
        await loadProjects();
      }
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to delete project", "error");
    }
  }

  function getStatusColor(status: string) {
    return status === "active" ? "success" : "secondary";
  }

  // Column definitions
  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Project Name",
        cell: ({ row }) => (
          <div className="fw-bold">{row.original.name}</div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ getValue }) => {
          const desc = getValue<string>();
          return desc ? (
            <span className="text-muted">{desc.substring(0, 50)}{desc.length > 50 ? "..." : ""}</span>
          ) : (
            <span className="text-muted fst-italic">No description</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue<string>();
          return (
            <Badge bg={getStatusColor(status)}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "ownerId",
        header: "Owner",
        cell: ({ row }) => row.original.ownerId?.name || "N/A",
      },
      {
        accessorKey: "members",
        header: "Members",
        cell: ({ row }) => (
          <span>{row.original.members?.length || 0} members</span>
        ),
      },
      {
        accessorKey: "taskCount",
        header: "Tasks",
        cell: ({ getValue }) => (
          <Badge bg="info">{getValue<number>() || 0}</Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ getValue }) => {
          const date = getValue<string>();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const project = row.original;
          return (
            <div className="d-flex gap-1 justify-content-center flex-wrap">
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => openEditModal(project)}
                title="Edit Project"
              >
                <Edit2 size={14} />
              </Button>
              <Button
                size="sm"
                variant="outline-info"
                onClick={() => openMembersModal(project)}
                title="Manage Members"
              >
                <Users size={14} />
              </Button>
              <Button
                size="sm"
                variant={project.status === "active" ? "outline-warning" : "outline-success"}
                onClick={() => handleToggleStatus(project)}
                title={project.status === "active" ? "Archive" : "Activate"}
              >
                {project.status === "active" ? "📦" : "🔓"}
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => handleDeleteProject(project)}
                title="Delete Project"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <AdminLayout title="Projects Management">
      <Container fluid>
        <Row className="mb-4">
          <Col>
            <p className="text-muted">Create, edit, and manage projects</p>
          </Col>
          <Col md="auto">
            <Button
              variant="success"
              size="lg"
              onClick={openCreateModal}
              className="d-flex align-items-center gap-2"
            >
              <span>➕</span> New Project
            </Button>
          </Col>
        </Row>

        {/* Filters Card */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="g-3">
              <Col md={12}>
                <Form.Label>Status Filter</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as "all" | "active" | "archived");
                    setPagination({ ...pagination, pageIndex: 0 });
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </Form.Select>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Projects Table */}
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="p-3">
              <AdminDataTable
                data={projects}
                columns={columns}
                loading={loading}
                pageCount={pageCount}
                totalItems={totalCount}
                emptyMessage="No projects found"
                onPaginationChange={setPagination}
                onSortingChange={setSorting}
                onGlobalFilterChange={(filter) => {
                  setGlobalFilter(filter);
                  setPagination({ ...pagination, pageIndex: 0 });
                }}
                initialPageSize={10}
              />
            </div>
          </Card.Body>
        </Card>

        {/* Create Modal */}
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>➕ Create New Project</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Project Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter project name"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter project description"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateProject}>
              Create Project
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>✏️ Edit Project</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Project Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter project name"
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter project description"
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateProject}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Manage Members Modal */}
        <Modal show={showMembersModal} onHide={() => setShowMembersModal(false)} centered size="lg">
          <Modal.Header closeButton>
            <Modal.Title>👥 Manage Project Members - {selectedProject?.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="mb-3">
              <h6>Add Member</h6>
              <div className="d-flex gap-2">
                <Form.Select
                  value={selectedMemberToAdd}
                  onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                >
                  <option value="">Select a user...</option>
                  {users
                    .filter(u => !selectedProject?.members?.some(m => m._id === u._id))
                    .map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                </Form.Select>
                <Button variant="primary" onClick={handleAddMember} disabled={!selectedMemberToAdd}>
                  Add
                </Button>
              </div>
            </div>
            <hr />
            <div>
              <h6>Current Members ({selectedProject?.members?.length || 0})</h6>
              {selectedProject?.members && selectedProject.members.length > 0 ? (
                <div className="list-group">
                  {selectedProject.members.map((member) => (
                    <div
                      key={member._id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <span>{member.name}</span>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleRemoveMember(member._id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No members yet</p>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowMembersModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </AdminLayout>
  );
}
