import { useEffect, useState, useMemo } from "react";
import { Container, Row, Col, Card, Button, Badge, Form } from "react-bootstrap";
import { type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table";
import Swal from "sweetalert2";
import api from "../../api/axios";
import { approveUser, rejectUser, resetUserPassword, type User } from "../../api/admin";
import CreateUserModal from "./Users/CreateUserModal";
import EditUserModal from "./Users/EditUserModal";
import AdminLayout from "../../components/Admin/AdminLayout";
import AdminDataTable from "../../components/Admin/AdminDataTable";
import { useAuth } from "../../hooks/useAuth";
import "../../styles/admin.css";

export default function UsersAdmin() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Data state
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
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Load users with server-side features
  async function loadUsers() {
    try {
      setLoading(true);
      const sortBy = sorting[0]?.id || "createdAt";
      const sortOrder = sorting[0]?.desc ? "desc" : "asc";

      const response = await api.get("/users", {
        params: {
          page: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          sortBy,
          sortOrder,
          search: globalFilter,
          role: roleFilter !== "all" ? roleFilter : undefined,
          active: statusFilter !== "all" ? statusFilter : undefined,
        },
      });

      setUsers(response.data.data);
      setTotalCount(response.data.totalCount);
      setPageCount(response.data.totalPages);
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }

  // Reload when table state changes
  useEffect(() => {
    loadUsers();
  }, [pagination, sorting, globalFilter, roleFilter, statusFilter]);

  // Handler functions
  async function handleToggleActive(user: User) {
    try {
      const action = user.active ? "deactivate" : "activate";
      const confirmed = await Swal.fire({
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} User?`,
        text: `Are you sure you want to ${action} ${user.name}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: user.active ? "#dc3545" : "#28a745",
        confirmButtonText: `Yes, ${action}`,
      });

      if (confirmed.isConfirmed) {
        await api.patch(`/users/${user._id}`, { active: !user.active });
        await loadUsers();
        Swal.fire("Success", `User ${action}d successfully`, "success");
      }
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Operation failed", "error");
    }
  }

  async function handleResetPassword(user: User) {
    const { value: newPassword } = await Swal.fire({
      title: "Reset Password",
      input: "password",
      inputPlaceholder: "Enter new password (min 6 chars)",
      inputAttributes: { minlength: "6" },
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) return "Password is required";
        if (value.length < 6) return "Password must be at least 6 characters";
      },
    });

    if (newPassword) {
      try {
        await resetUserPassword(user._id, { password: newPassword });
        Swal.fire("Success", "Password reset successfully", "success");
      } catch (error: any) {
        Swal.fire("Error", error?.response?.data?.message || "Failed to reset password", "error");
      }
    }
  }

  function handleEditUser(user: User) {
    setSelectedUser(user);
    setShowEditModal(true);
  }

  function handleUserCreated() {
    setShowCreateModal(false);
    loadUsers();
  }

  function handleUserUpdated() {
    setShowEditModal(false);
    setSelectedUser(null);
    loadUsers();
  }

  async function handleApproveUser(user: User) {
    try {
      const result = await Swal.fire({
        title: "Approve User?",
        text: `Approve ${user.name}? They'll receive an email notification.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        confirmButtonText: "Yes, Approve",
      });

      if (result.isConfirmed) {
        await approveUser(user._id);
        await loadUsers();
        Swal.fire("Approved!", "User has been approved and notified via email.", "success");
      }
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to approve user", "error");
    }
  }

  async function handleRejectUser(user: User) {
    try {
      const { value: reason } = await Swal.fire({
        title: "Reject User?",
        text: `Reject ${user.name}?`,
        input: "textarea",
        inputPlaceholder: "Reason for rejection (optional)",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        confirmButtonText: "Yes, Reject",
      });

      if (reason !== undefined) {
        await rejectUser(user._id, reason);
        await loadUsers();
        Swal.fire("Rejected", "User has been rejected and removed.", "success");
      }
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to reject user", "error");
    }
  }

  async function handleDeleteUser(user: User) {
    try {
      const result = await Swal.fire({
        title: "Permanently Delete User?",
        html: `This will permanently delete <strong>${user.name}</strong> and all associated data.<br><br><span style="color: red;">This action cannot be undone!</span>`,
        icon: "error",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        confirmButtonText: "Yes, Delete Permanently",
      });

      if (result.isConfirmed) {
        await api.delete(`/users/${user._id}`);
        await loadUsers();
        Swal.fire("Deleted!", "User has been permanently deleted.", "success");
      }
    } catch (error: any) {
      Swal.fire("Error", error?.response?.data?.message || "Failed to delete user", "error");
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "danger";
      case "manager": return "warning";
      case "developer": return "info";
      default: return "secondary";
    }
  };

  // Column definitions
  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="d-flex align-items-center gap-2">
            <div
              className="avatar-circle"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#e9ecef",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: "bold",
                color: "#495057",
              }}
            >
              {row.original.name.charAt(0).toUpperCase()}
            </div>
            <span>{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ getValue }) => {
          const role = getValue<string>();
          return (
            <Badge bg={getRoleBadgeColor(role)}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          );
        },
      },
      {
        accessorKey: "active",
        header: "Status",
        cell: ({ getValue }) => {
          const active = getValue<boolean>();
          return (
            <Badge bg={active ? "success" : "warning"}>
              {active ? "Active" : "Pending"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "lastLogin",
        header: "Last Login",
        cell: ({ getValue }) => {
          const lastLogin = getValue<string>();
          if (!lastLogin) return <span className="text-muted">Never</span>;

          const date = new Date(lastLogin);
          const now = new Date();
          const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

          let timeAgo;
          if (diff < 1) timeAgo = 'Just now';
          else if (diff < 60) timeAgo = `${diff}m ago`;
          else if (diff < 1440) timeAgo = `${Math.floor(diff / 60)}h ago`;
          else timeAgo = `${Math.floor(diff / 1440)}d ago`;

          return (
            <div>
              <div>{timeAgo}</div>
              <small className="text-muted">{date.toLocaleDateString()}</small>
            </div>
          );
        },
      },
      {
        accessorKey: "isActive",
        header: "Activity",
        cell: ({ row }) => {
          const isActive = row.original.isActive;
          const lastActivity = row.original.lastActivity;

          // Consider active if logged in within last 15 minutes
          const isOnline = lastActivity &&
            (new Date().getTime() - new Date(lastActivity).getTime()) < 15 * 60 * 1000;

          return (
            <Badge bg={isOnline ? "success" : isActive ? "secondary" : "danger"}>
              {isOnline ? "🟢 Online" : isActive ? "Active" : "Inactive"}
            </Badge>
          );
        },
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
          const user = row.original;
          return (
            <div className="d-flex gap-1 justify-content-center flex-wrap">
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => handleEditUser(user)}
                title="Edit User"
              >
                <i className="bi bi-pencil"></i>
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => handleResetPassword(user)}
                title="Reset Password"
              >
                <i className="bi bi-key"></i>
              </Button>
              {!user.active && (
                <>
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleApproveUser(user)}
                    title="Approve User"
                  >
                    <i className="bi bi-check-circle"></i>
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleRejectUser(user)}
                    title="Reject User"
                  >
                    <i className="bi bi-x-circle"></i>
                  </Button>
                </>
              )}
              {user.active && (
                <>
                  <Button
                    size="sm"
                    variant="outline-warning"
                    onClick={() => handleToggleActive(user)}
                    title="Deactivate User"
                  >
                    <i className="bi bi-lock"></i>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => handleDeleteUser(user)}
                    title="Delete Permanently"
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <AdminLayout title="User Management">
      <Container fluid className="admin-users-page">
        <Row className="mb-4">
          <Col>
            <p className="text-muted">Create, edit, and manage system users</p>
          </Col>
          <Col md="auto">
            {isAdmin && (
              <Button
                variant="success"
                size="lg"
                onClick={() => setShowCreateModal(true)}
                className="d-flex align-items-center gap-2"
              >
                <span>➕</span> New User
              </Button>
            )}
          </Col>
        </Row>

        {/* Filters Card */}
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <Row className="g-3">
              <Col md={6}>
                <Form.Label>Role Filter</Form.Label>
                <Form.Select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setPagination({ ...pagination, pageIndex: 0 });
                  }}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="developer">Developer</option>
                </Form.Select>
              </Col>

              <Col md={6}>
                <Form.Label>Status Filter</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination({ ...pagination, pageIndex: 0 });
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Pending</option>
                </Form.Select>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Users Table */}
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="p-3">
              <AdminDataTable
                data={users}
                columns={columns}
                loading={loading}
                pageCount={pageCount}
                totalItems={totalCount}
                emptyMessage="No users found"
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

        {/* Modals */}
        <CreateUserModal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          onUserCreated={handleUserCreated}
        />
        <EditUserModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      </Container>
    </AdminLayout>
  );
}
