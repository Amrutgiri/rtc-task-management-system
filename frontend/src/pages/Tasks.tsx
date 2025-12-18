import { useEffect, useState, useMemo } from "react";
import MainLayout from "../layout/MainLayout";
import { useNavigate } from "react-router-dom";
import { type ColumnDef, type PaginationState, type SortingState } from "@tanstack/react-table";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../api/tasks";
import { getProjects } from "../api/projects";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import { Button, Card, Col, Modal, Form, Row, ButtonGroup, Badge } from "react-bootstrap";
import { Edit2, Clock, List, LayoutGrid } from "lucide-react";
import AdminDataTable from "../components/Admin/AdminDataTable";
import TaskEditModal from "../components/TaskEditModal";
import LogWorkModal from "../components/LogWorkModal";
import Swal from "sweetalert2";

interface Task {
  _id: string;
  title: string;
  description: string;
  projectId: { _id: string; name: string };
  assigneeId?: { _id: string; name: string; email: string };
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

export default function Tasks() {
  const statuses = ["open", "in-progress", "review", "completed"];

  const navigate = useNavigate();

  // View mode state
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLogWorkModal, setShowLogWorkModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // Form state
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    status: "open",
    priority: "medium",
  });

  // Table state (for table view)
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true }
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Filters
  const [filterProject, setFilterProject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");

  useEffect(() => {
    if (viewMode === 'kanban') {
      loadTasksForKanban();
    } else {
      loadTasksForTable();
    }
    loadProjects();
    loadUsers();
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'table') {
      loadTasksForTable();
    }
  }, [pagination, sorting, globalFilter, filterProject, filterStatus, filterPriority, filterAssignee]);

  async function loadTasksForKanban() {
    try {
      const res = await getTasks();
      setTasks(res.data || []);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    }
  }

  async function loadTasksForTable() {
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

  async function loadProjects() {
    try {
      const res = await getProjects();
      setProjects(res.data.data || res.data || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  }

  async function loadUsers() {
    try {
      // Get users from admin users API if available
      // For now, we'll skip this or implement later
      // const res = await getUsers();
      // setUsers(res.data.data || res.data || []);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }

  function handleChange(e: any) {
    setTaskForm({ ...taskForm, [e.target.name]: e.target.value });
  }

  async function handleCreateTask() {
    if (!taskForm.title.trim()) {
      Swal.fire("Error", "Task title is required", "error");
      return;
    }

    if (!taskForm.projectId) {
      Swal.fire("Error", "Please select a project", "error");
      return;
    }

    await createTask(taskForm);
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Task created successfully",
      timer: 2000,
      showConfirmButton: false,
    });
    setShowModal(false);
    setTaskForm({
      title: "",
      description: "",
      projectId: "",
      status: "open",
      priority: "medium",
    });
    viewMode === 'kanban' ? loadTasksForKanban() : loadTasksForTable();
  }

  // 🔥 Handle Drag & Drop (Kanban only)
  async function handleDragEnd(result: any) {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;

    // Optimistic update - immediately update the UI
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task._id === taskId ? { ...task, status: newStatus } : task
      )
    );

    try {
      await updateTask(taskId, { status: newStatus });

      Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "success",
        title: `Task moved to ${newStatus.replace("-", " ")}`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Failed to update task:", error);
      // Revert on error
      loadTasksForKanban();
      Swal.fire("Error", "Failed to update task status", "error");
    }
  }

  async function handleDelete(id: string) {
    const res = await Swal.fire({
      title: "Are you sure?",
      text: "This task will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    });

    if (res.isConfirmed) {
      await deleteTask(id);
      Swal.fire("Deleted!", "", "success");
      viewMode === 'kanban' ? loadTasksForKanban() : loadTasksForTable();
    }
  }

  function handleEditTask(task: any) {
    setSelectedTask(task);
    setShowEditModal(true);
  }

  function handleLogWork(task: any) {
    setSelectedTask(task);
    setShowLogWorkModal(true);
  }

  function handleTaskUpdated() {
    viewMode === 'kanban' ? loadTasksForKanban() : loadTasksForTable();
  }

  // Table columns
  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span
            className="text-primary fw-500"
            style={{ cursor: "pointer" }}
            onClick={() => navigate(`/tasks/${row.original._id}`)}
          >
            {row.original.title}
          </span>
        ),
      },
      {
        accessorKey: "projectId",
        header: "Project",
        cell: ({ row }) => row.original.projectId?.name || "—",
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
        accessorKey: "assigneeId",
        header: "Assignee",
        cell: ({ row }) => row.original.assigneeId?.name || "Unassigned",
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
            <div className="d-flex gap-1">
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => handleLogWork(task)}
                title="Log work"
              >
                <Clock size={14} />
              </Button>
              <Button
                size="sm"
                variant="outline-primary"
                onClick={() => handleEditTask(task)}
                title="Edit"
              >
                <Edit2 size={14} />
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => handleDelete(task._id)}
                title="Delete"
              >
                🗑️
              </Button>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <MainLayout>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold">Tasks</h3>

        <div className="d-flex gap-2">
          {/* View Toggle */}
          <ButtonGroup>
            <Button
              variant={viewMode === 'kanban' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid size={16} className="me-1" /> Kanban
            </Button>
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline-primary'}
              onClick={() => setViewMode('table')}
            >
              <List size={16} className="me-1" /> Table
            </Button>
          </ButtonGroup>

          <Button className="rounded-pill" onClick={() => setShowModal(true)}>
            + Add Task
          </Button>
        </div>
      </div>

      {/* Filters (only in table view) */}
      {viewMode === 'table' && (
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
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col md={3}>
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
              <Col md={3}>
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
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Row>
            {statuses.map((status) => (
              <Col key={status} md={3}>
                <h5 className="text-capitalize text-center mb-3">
                  {status.replace("-", " ")}
                </h5>

                <Droppable droppableId={status}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="kanban-column"
                    >
                      {tasks
                        .filter((t) => t.status === status)
                        .map((task, index) => (
                          <Draggable
                            key={task._id}
                            draggableId={task._id}
                            index={index}
                          >
                            {(provided) => (
                              <Card
                                className="mb-3 p-3 shadow-sm"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <h6
                                    className="fw-bold text-primary m-0"
                                    style={{ cursor: "pointer", flex: 1 }}
                                    onClick={() => navigate(`/tasks/${task._id}`)}
                                  >
                                    {task.title}
                                  </h6>
                                  <Button
                                    variant="light"
                                    size="sm"
                                    className="ms-1"
                                    onClick={() => handleLogWork(task)}
                                    title="Log work"
                                  >
                                    <Clock size={14} />
                                  </Button>
                                  <Button
                                    variant="light"
                                    size="sm"
                                    className="ms-1"
                                    onClick={() => handleEditTask(task)}
                                    title="Edit task"
                                  >
                                    <Edit2 size={14} />
                                  </Button>
                                </div>

                                <p className="text-muted small">
                                  {task.description || "No description"}
                                </p>

                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="badge bg-primary">
                                    {task.priority}
                                  </span>

                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleDelete(task._id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </Card>
                            )}
                          </Draggable>
                        ))}

                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </Col>
            ))}
          </Row>
        </DragDropContext>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="p-3">
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
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Create Task Modal */}
      <Modal centered show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Task</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Project *</Form.Label>
              <Form.Select
                name="projectId"
                value={taskForm.projectId}
                onChange={handleChange}
              >
                <option value="">-- Select a project --</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                name="title"
                value={taskForm.title}
                onChange={handleChange}
                placeholder="Task title"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                name="description"
                as="textarea"
                rows={3}
                value={taskForm.description}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select
                name="status"
                value={taskForm.status}
                onChange={handleChange}
              >
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Priority</Form.Label>
              <Form.Select
                name="priority"
                value={taskForm.priority}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button className="rounded-pill" onClick={handleCreateTask}>
            Create Task
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Task Edit Modal */}
      {selectedTask && (
        <TaskEditModal
          show={showEditModal}
          task={selectedTask}
          onHide={() => {
            setShowEditModal(false);
            setSelectedTask(null);
          }}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* Log Work Modal */}
      {selectedTask && (
        <LogWorkModal
          show={showLogWorkModal}
          task={selectedTask}
          onHide={() => {
            setShowLogWorkModal(false);
            setSelectedTask(null);
          }}
          onWebLogAdded={() => {
            // Optional: refresh tasks if needed
          }}
        />
      )}
    </MainLayout>
  );
}
