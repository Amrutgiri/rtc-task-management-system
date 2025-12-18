import { useState, useEffect, useMemo } from "react";
import { Container, Card, Button, Form, Row, Col, Badge, Modal, ButtonGroup } from "react-bootstrap";
import { type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table";
import AdminDataTable from "../../components/Admin/AdminDataTable";
import { getTasks, updateTask, deleteTask } from "../../api/tasks";
import { getProjects } from "../../api/projects";
import api from "../../api/axios";
import Swal from "sweetalert2";

interface Task {
    _id: string;
    title: string;
    description: string;
    projectId: { _id: string; name: string } | null;
    assigneeId: { _id: string; name: string; email: string } | null;
    status: string;
    priority: string;
    taskDate: string;
    createdAt: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
}

export default function AdminTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [pageCount, setPageCount] = useState(0);

    // Pagination & Sorting
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [sorting, setSorting] = useState<SortingState>([
        { id: "createdAt", desc: true }
    ]);
    const [globalFilter, setGlobalFilter] = useState("");

    // Filters
    const [projects, setProjects] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [filterProject, setFilterProject] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [filterAssignee, setFilterAssignee] = useState("");

    // Bulk Actions
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkAction, setBulkAction] = useState<'status' | 'assignee' | 'priority'>('status');
    const [bulkValue, setBulkValue] = useState("");

    // Orphaned tasks
    const [orphanedCount, setOrphanedCount] = useState(0);

    useEffect(() => {
        fetchProjects();
        fetchUsers();
        fetchOrphanedCount();
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [pagination, sorting, globalFilter, filterProject, filterStatus, filterPriority, filterAssignee]);

    async function fetchProjects() {
        try {
            const res = await getProjects();
            setProjects(res.data.data || res.data || []);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        }
    }

    async function fetchUsers() {
        try {
            const res = await api.get("/users");
            setUsers(res.data.data || res.data || []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
    }

    async function fetchOrphanedCount() {
        try {
            const res = await api.get("/tasks/orphaned");
            setOrphanedCount(res.data.count || 0);
        } catch (error) {
            console.error("Failed to fetch orphaned count:", error);
        }
    }

    async function fetchTasks() {
        try {
            setLoading(true);
            const sortBy = sorting[0]?.id || "createdAt";
            const sortOrder = sorting[0]?.desc ? "desc" : "asc";

            const params: any = {
                page: pagination.pageIndex + 1,
                pageSize: pagination.pageSize,
                sortBy,
                sortOrder,
                search: globalFilter,
            };

            if (filterProject) params.project = filterProject;
            if (filterStatus) params.status = filterStatus;
            if (filterPriority) params.priority = filterPriority;
            if (filterAssignee) params.assignee = filterAssignee;

            const response = await getTasks(params);
            setTasks(response.data.data || []);
            setTotalCount(response.data.totalCount || 0);
            setPageCount(response.data.totalPages || 0);
        } catch (error: any) {
            console.error("Failed to fetch tasks:", error);
            Swal.fire("Error", error?.response?.data?.message || "Failed to load tasks", "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "This task will be permanently deleted!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Delete",
        });

        if (result.isConfirmed) {
            try {
                await deleteTask(id);
                Swal.fire("Deleted!", "Task has been deleted.", "success");
                fetchTasks();
                fetchOrphanedCount();
            } catch (error) {
                Swal.fire("Error", "Failed to delete task", "error");
            }
        }
    }

    function handleSelectTask(taskId: string, isSelected: boolean) {
        if (isSelected) {
            setSelectedTasks([...selectedTasks, taskId]);
        } else {
            setSelectedTasks(selectedTasks.filter(id => id !== taskId));
        }
    }

    function handleSelectAll(isSelected: boolean) {
        if (isSelected) {
            setSelectedTasks(tasks.map(t => t._id));
        } else {
            setSelectedTasks([]);
        }
    }

    async function handleBulkAction() {
        if (selectedTasks.length === 0) {
            Swal.fire("Warning", "Please select at least one task", "warning");
            return;
        }

        if (!bulkValue) {
            Swal.fire("Warning", "Please select a value", "warning");
            return;
        }

        try {
            const updates: any = {};

            if (bulkAction === 'status') {
                updates.status = bulkValue;
            } else if (bulkAction === 'priority') {
                updates.priority = bulkValue;
            } else if (bulkAction === 'assignee') {
                updates.assigneeId = bulkValue === 'unassign' ? null : bulkValue;
            }

            await api.put("/tasks/bulk/update", {
                taskIds: selectedTasks,
                updates
            });

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: `${selectedTasks.length} task(s) updated successfully`,
                showConfirmButton: false,
                timer: 2000,
            });

            setSelectedTasks([]);
            setShowBulkModal(false);
            setBulkValue("");
            fetchTasks();
            fetchOrphanedCount();
        } catch (error: any) {
            Swal.fire("Error", error?.response?.data?.message || "Failed to update tasks", "error");
        }
    }

    async function handleBulkDelete() {
        if (selectedTasks.length === 0) {
            Swal.fire("Warning", "Please select at least one task", "warning");
            return;
        }

        const result = await Swal.fire({
            title: "Are you sure?",
            text: `You are about to delete ${selectedTasks.length} task(s)!`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Delete All",
        });

        if (result.isConfirmed) {
            try {
                await api.delete("/tasks/bulk/delete", {
                    data: { taskIds: selectedTasks }
                });

                Swal.fire("Deleted!", `${selectedTasks.length} task(s) have been deleted.`, "success");
                setSelectedTasks([]);
                fetchTasks();
                fetchOrphanedCount();
            } catch (error: any) {
                Swal.fire("Error", error?.response?.data?.message || "Failed to delete tasks", "error");
            }
        }
    }

    function clearFilters() {
        setFilterProject("");
        setFilterStatus("");
        setFilterPriority("");
        setFilterAssignee("");
        setGlobalFilter("");
        setPagination({ ...pagination, pageIndex: 0 });
    }

    const columns = useMemo<ColumnDef<Task>[]>(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <input
                        type="checkbox"
                        checked={selectedTasks.length === tasks.length && tasks.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                ),
                cell: ({ row }) => (
                    <input
                        type="checkbox"
                        checked={selectedTasks.includes(row.original._id)}
                        onChange={(e) => handleSelectTask(row.original._id, e.target.checked)}
                    />
                ),
                size: 40,
            },
            {
                accessorKey: "title",
                header: "Title",
                cell: ({ row }) => (
                    <div>
                        <div className="fw-500">{row.original.title}</div>
                        {row.original.description && (
                            <small className="text-muted">{row.original.description.substring(0, 50)}...</small>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: "projectId",
                header: "Project",
                cell: ({ row }) => row.original.projectId?.name || <Badge bg="warning">No Project</Badge>,
            },
            {
                accessorKey: "assigneeId",
                header: "Assignee",
                cell: ({ row }) => row.original.assigneeId?.name || <Badge bg="secondary">Unassigned</Badge>,
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ getValue }) => {
                    const status = getValue<string>();
                    const colors: any = {
                        open: "secondary",
                        "in-progress": "primary",
                        review: "warning",
                        completed: "success",
                    };
                    return (
                        <Badge bg={colors[status] || "secondary"}>
                            {status.replace("-", " ")}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: "priority",
                header: "Priority",
                cell: ({ getValue }) => {
                    const priority = getValue<string>();
                    const colors: any = {
                        low: "success",
                        medium: "warning",
                        high: "danger",
                    };
                    return <Badge bg={colors[priority] || "secondary"}>{priority}</Badge>;
                },
            },
            {
                accessorKey: "taskDate",
                header: "Due Date",
                cell: ({ getValue }) => {
                    const date = getValue<string>();
                    return date ? new Date(date).toLocaleDateString() : "—";
                },
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => {
                    const task = row.original;
                    return (
                        <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(task._id)}
                        >
                            Delete
                        </Button>
                    );
                },
            },
        ],
        [selectedTasks, tasks]
    );

    return (
        <Container fluid>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-1">Admin Task Management</h3>
                    <p className="text-muted mb-0">
                        Manage all tasks across all projects
                        {orphanedCount > 0 && (
                            <Badge bg="warning" className="ms-2">
                                {orphanedCount} Orphaned Tasks
                            </Badge>
                        )}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={3}>
                            <Form.Label>Project</Form.Label>
                            <Form.Select
                                value={filterProject}
                                onChange={(e) => {
                                    setFilterProject(e.target.value);
                                    setPagination({ ...pagination, pageIndex: 0 });
                                }}
                            >
                                <option value="">All Projects</option>
                                {projects.map((p) => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label>Status</Form.Label>
                            <Form.Select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value);
                                    setPagination({ ...pagination, pageIndex: 0 });
                                }}
                            >
                                <option value="">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="completed">Completed</option>
                            </Form.Select>
                        </Col>
                        <Col md={2}>
                            <Form.Label>Priority</Form.Label>
                            <Form.Select
                                value={filterPriority}
                                onChange={(e) => {
                                    setFilterPriority(e.target.value);
                                    setPagination({ ...pagination, pageIndex: 0 });
                                }}
                            >
                                <option value="">All Priorities</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label>Assignee</Form.Label>
                            <Form.Select
                                value={filterAssignee}
                                onChange={(e) => {
                                    setFilterAssignee(e.target.value);
                                    setPagination({ ...pagination, pageIndex: 0 });
                                }}
                            >
                                <option value="">All Users</option>
                                {users.map((u) => (
                                    <option key={u._id} value={u._id}>{u.name}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={2} className="d-flex align-items-end">
                            <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
                                Clear Filters
                            </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Bulk Actions Bar */}
            {selectedTasks.length > 0 && (
                <Card className="mb-3 shadow-sm border-primary">
                    <Card.Body className="py-2">
                        <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold text-primary">
                                {selectedTasks.length} task(s) selected
                            </span>
                            <ButtonGroup>
                                <Button
                                    size="sm"
                                    variant="outline-primary"
                                    onClick={() => {
                                        setBulkAction('status');
                                        setShowBulkModal(true);
                                    }}
                                >
                                    Change Status
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline-success"
                                    onClick={() => {
                                        setBulkAction('assignee');
                                        setShowBulkModal(true);
                                    }}
                                >
                                    Assign To
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline-warning"
                                    onClick={() => {
                                        setBulkAction('priority');
                                        setShowBulkModal(true);
                                    }}
                                >
                                    Set Priority
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={handleBulkDelete}
                                >
                                    Delete Selected
                                </Button>
                            </ButtonGroup>
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* Tasks Table */}
            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    <AdminDataTable
                        data={tasks}
                        columns={columns}
                        loading={loading}
                        pageCount={pageCount}
                        totalItems={totalCount}
                        emptyMessage="No tasks found"
                        onPaginationChange={setPagination}
                        onSortingChange={setSorting}
                        onGlobalFilterChange={(filter) => {
                            setGlobalFilter(filter);
                            setPagination({ ...pagination, pageIndex: 0 });
                        }}
                        initialPageSize={10}
                    />
                </Card.Body>
            </Card>

            {/* Bulk Action Modal */}
            <Modal show={showBulkModal} onHide={() => setShowBulkModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Bulk {bulkAction === 'status' ? 'Status Change' : bulkAction === 'assignee' ? 'Assignment' : 'Priority Change'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>
                            Select {bulkAction === 'status' ? 'new status' : bulkAction === 'assignee' ? 'assignee' : 'priority'} for {selectedTasks.length} task(s)
                        </Form.Label>

                        {bulkAction === 'status' && (
                            <Form.Select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}>
                                <option value="">-- Select Status --</option>
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="completed">Completed</option>
                            </Form.Select>
                        )}

                        {bulkAction === 'priority' && (
                            <Form.Select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}>
                                <option value="">-- Select Priority --</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </Form.Select>
                        )}

                        {bulkAction === 'assignee' && (
                            <Form.Select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)}>
                                <option value="">-- Select User --</option>
                                <option value="unassign">Unassign All</option>
                                {users.map((u) => (
                                    <option key={u._id} value={u._id}>{u.name}</option>
                                ))}
                            </Form.Select>
                        )}
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleBulkAction}>
                        Apply to {selectedTasks.length} Task(s)
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
