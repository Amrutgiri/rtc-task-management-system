import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layout/MainLayout";
import { getProjects } from "../api/projects";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Card, Button, Badge, Modal, Form, Spinner } from "react-bootstrap";
import { Plus, Calendar, User, AlertCircle, Trash2, Paperclip } from "lucide-react";
import Swal from "sweetalert2";
import { AuthContext } from "../context/AuthContext";
import { getTasks, updateTask, createTask, deleteTask } from "../api/tasks";
import "../styles/kanban.css";
import "../styles/kanban-mobile-fixes.css";

interface Task {
    _id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    taskDate?: string;
    assigneeId?: { _id: string; name: string; email: string };
    projectId?: { _id: string; name: string };
    createdBy: string; // ID
}

interface Project {
    _id: string;
    name: string;
}

export default function KanbanBoard() {
    const navigate = useNavigate();
    const auth = useContext(AuthContext);
    const user = auth?.user;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [filterProject, setFilterProject] = useState<string>("");
    const [filterDate, setFilterDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [searchQuery, setSearchQuery] = useState("");

    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        projectId: "",
        priority: "medium",
        status: "open",
    });

    const columns = [
        { id: "open", title: "To Do", color: "#6c757d" },
        { id: "in-progress", title: "In Progress", color: "#0d6efd" },
        { id: "review", title: "Review", color: "#ffc107" },
        { id: "completed", title: "Done", color: "#198754" },
    ];

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [tasksRes, projectsRes] = await Promise.all([
                getTasks(),
                getProjects(),
            ]);
            setTasks(tasksRes.data);
            setProjects(projectsRes.data.data || []);
        } catch (error) {
            console.error("Failed to load data:", error);
            Swal.fire("Error", "Failed to load kanban board data", "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleDragEnd(result: any) {
        if (!result.destination) return;

        const taskId = result.draggableId;
        const newStatus = result.destination.droppableId;

        // Optimistic update
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
                title: `Task moved to ${columns.find(c => c.id === newStatus)?.title}`,
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error("Failed to update task:", error);
            // Revert on error
            loadData();
            Swal.fire("Error", "Failed to update task status", "error");
        }
    }

    function handleOpenCreateModal(status: string) {
        setNewTask({ ...newTask, status });
        setShowCreateModal(true);
    }

    async function handleCreateTask() {
        if (!newTask.title.trim()) {
            Swal.fire("Error", "Task title is required", "error");
            return;
        }

        if (!newTask.projectId) {
            Swal.fire("Error", "Please select a project", "error");
            return;
        }

        try {
            await createTask(newTask);

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Task created successfully",
                timer: 2000,
                showConfirmButton: false,
            });

            setShowCreateModal(false);
            setNewTask({
                title: "",
                description: "",
                projectId: "",
                priority: "medium",
                status: "open",
            });
            loadData();
        } catch (error) {
            console.error("Failed to create task:", error);
            Swal.fire("Error", "Failed to create task", "error");
        }
    }

    async function handleDelete(taskId: string) {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deleteTask(taskId);
                loadData(); // Reload to remove from UI
                Swal.fire(
                    'Deleted!',
                    'Your task has been deleted.',
                    'success'
                );
            } catch (error: any) {
                console.error("Delete Error", error);
                Swal.fire("Error", error.response?.data?.message || "Failed to delete task", "error");
            }
        }
    }

    function getPriorityColor(priority: string) {
        const colors: Record<string, string> = {
            low: "info",
            medium: "warning",
            high: "danger",
        };
        return colors[priority] || "secondary";
    }

    function formatDate(dateString?: string) {
        if (!dateString) return null;
        const date = new Date(dateString);
        const today = new Date();
        const diffTime = date.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return <Badge bg="danger">Overdue</Badge>;
        if (diffDays === 0) return <Badge bg="warning">Today</Badge>;
        if (diffDays === 1) return <Badge bg="info">Tomorrow</Badge>;
        return <Badge bg="secondary">{diffDays}d</Badge>;
    }

    // ... handleDragEnd ...

    // Filter Logic
    const filteredTasks = tasks.filter((task) => {
        // Project Filter
        const matchProject = filterProject
            ? task.projectId?._id === filterProject
            : true;

        // Date Filter
        let matchDate = true;
        if (filterDate && task.taskDate) {
            // Use local date string to match user's selected date (YYYY-MM-DD)
            const taskDate = new Date(task.taskDate).toLocaleDateString('en-CA');
            matchDate = taskDate === filterDate;
        } else if (filterDate && !task.taskDate) {
            // If date filter is active but task has no date, hide it? 
            // Or only show matches? Assuming "Due Date" filter.
            // If implementing "Tasks for this date", implies tasks due or created.
            // Using 'taskDate' as per code above in formatDate.
            matchDate = false;
        }

        // Search Filter
        const matchSearch = searchQuery
            ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
            : true;

        return matchProject && matchDate && matchSearch;
    });

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
            <div className="kanban-container">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold mb-0">Kanban Board</h3>

                    <div className="d-flex gap-2">
                        <Form.Control
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: "200px" }}
                        />

                        <Form.Control
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            style={{ width: "160px" }}
                        />

                        <Form.Select
                            value={filterProject}
                            onChange={(e) => setFilterProject(e.target.value)}
                            style={{ width: "200px" }}
                        >
                            <option value="">All Projects</option>
                            {projects.map((project) => (
                                <option key={project._id} value={project._id}>
                                    {project.name}
                                </option>
                            ))}
                        </Form.Select>

                        <Button
                            variant="primary"
                            onClick={() => handleOpenCreateModal("open")}
                            className="d-flex align-items-center gap-2"
                        >
                            <Plus size={18} />
                            Add Task
                        </Button>
                    </div>
                </div>

                {/* Kanban Board */}
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="kanban-board">
                        {columns.map((column) => {
                            const columnTasks = filteredTasks.filter(
                                (task) => task.status === column.id
                            );

                            return (
                                <div key={column.id} className="kanban-column-wrapper">
                                    <div className="kanban-column-header" style={{ borderTopColor: column.color }}>
                                        <h5 className="mb-0">{column.title}</h5>
                                        <Badge bg="secondary" pill>
                                            {columnTasks.length}
                                        </Badge>
                                    </div>

                                    <Droppable droppableId={column.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`kanban-column ${snapshot.isDraggingOver ? "dragging-over" : ""
                                                    }`}
                                            >
                                                {columnTasks.map((task, index) => (
                                                    <Draggable
                                                        key={task._id}
                                                        draggableId={task._id}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <Card
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`kanban-card ${snapshot.isDragging ? "dragging" : ""
                                                                    }`}
                                                                onClick={() => navigate(`/tasks/${task._id}`)}
                                                            >
                                                                <Card.Body>
                                                                    {/* Priority Badge */}
                                                                    <div className="mb-2 d-flex justify-content-between align-items-start">
                                                                        <Badge bg={getPriorityColor(task.priority)} className="priority-badge">
                                                                            {task.priority}
                                                                        </Badge>

                                                                        {/* Delete Icon (Only for Creator or Admin) */}
                                                                        {(user?.role === 'admin' || user?.id === task.createdBy) && (
                                                                            <div
                                                                                className="text-danger cursor-pointer p-1 rounded hover-bg-light"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDelete(task._id);
                                                                                }}
                                                                                title="Delete Task"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Title */}
                                                                    <h6 className="card-title mb-2">{task.title}</h6>

                                                                    {/* Description */}
                                                                    {task.description && (
                                                                        <p className="card-description text-muted small mb-3">
                                                                            {task.description.length > 80
                                                                                ? task.description.substring(0, 80) + "..."
                                                                                : task.description}
                                                                        </p>
                                                                    )}

                                                                    {/* Meta Info */}
                                                                    <div className="card-meta">
                                                                        {task.projectId && (
                                                                            <div className="meta-item">
                                                                                <AlertCircle size={14} />
                                                                                <span>{task.projectId.name}</span>
                                                                            </div>
                                                                        )}

                                                                        {task.assigneeId && (
                                                                            <div className="meta-item">
                                                                                <User size={14} />
                                                                                <span>{task.assigneeId.name}</span>
                                                                            </div>
                                                                        )}

                                                                        {task.taskDate && (
                                                                            <div className="meta-item">
                                                                                <Calendar size={14} />
                                                                                {formatDate(task.taskDate)}
                                                                            </div>
                                                                        )}

                                                                        {/* Attachment Count */}
                                                                        {task.attachments && task.attachments.length > 0 && (
                                                                            <div className="meta-item">
                                                                                <Paperclip size={14} />
                                                                                <span>{task.attachments.length}</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </Card.Body>
                                                            </Card>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}

                                                {/* Add Task Button */}
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    className="w-100 mt-2 add-task-btn"
                                                    onClick={() => handleOpenCreateModal(column.id)}
                                                >
                                                    <Plus size={16} /> Add Task
                                                </Button>
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>

                {/* Create Task Modal */}
                <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Create New Task</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Project *</Form.Label>
                                <Form.Select
                                    value={newTask.projectId}
                                    onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                                >
                                    <option value="">-- Select Project --</option>
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
                                    type="text"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    placeholder="Enter task title"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    placeholder="Enter task description"
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Priority</Form.Label>
                                <Form.Select
                                    value={newTask.priority}
                                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    value={newTask.status}
                                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                                >
                                    <option value="open">To Do</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="review">Review</option>
                                    <option value="completed">Done</option>
                                </Form.Select>
                            </Form.Group>
                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleCreateTask}>
                            Create Task
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </MainLayout>
    );
}
