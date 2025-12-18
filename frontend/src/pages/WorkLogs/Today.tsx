import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Alert, Table, Badge } from "react-bootstrap";
import MainLayout from "../../layout/MainLayout";
import { createWorkLog, getWorkLogs } from "../../api/worklogs";
import { getTasks } from "../../api/tasks";
import Swal from "sweetalert2";

interface Task {
    _id: string;
    title: string;
    projectId?: { name: string };
}

interface WorkLog {
    _id: string;
    taskId?: { _id: string; title: string };
    date: string;
    durationMinutes: number;
    notes: string;
}

export default function WorkLogsToday() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [todayLogs, setTodayLogs] = useState<WorkLog[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        taskId: "",
        date: new Date().toISOString().split('T')[0],
        hours: "",
        minutes: "",
        notes: "",
    });

    useEffect(() => {
        loadTasks();
        loadTodayLogs();
    }, []);

    async function loadTasks() {
        try {
            const response = await getTasks();
            setTasks(response.data || []);
        } catch (error) {
            console.error("Failed to load tasks:", error);
        }
    }

    async function loadTodayLogs() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await getWorkLogs({
                startDate: today,
                endDate: today,
            });
            setTodayLogs(response.data.data || response.data || []);
        } catch (error) {
            console.error("Failed to load today's logs:", error);
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const hours = parseInt(formData.hours) || 0;
        const minutes = parseInt(formData.minutes) || 0;
        const durationMinutes = (hours * 60) + minutes;

        if (durationMinutes <= 0) {
            Swal.fire("Error", "Please enter a valid duration", "error");
            return;
        }

        try {
            setLoading(true);
            await createWorkLog({
                taskId: formData.taskId || undefined,
                date: formData.date,
                durationMinutes,
                notes: formData.notes,
            });

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Work log added successfully",
                showConfirmButton: false,
                timer: 2000,
            });

            // Reset form
            setFormData({
                taskId: "",
                date: new Date().toISOString().split('T')[0],
                hours: "",
                minutes: "",
                notes: "",
            });

            loadTodayLogs();
        } catch (error: any) {
            Swal.fire("Error", error?.response?.data?.message || "Failed to add work log", "error");
        } finally {
            setLoading(false);
        }
    }

    function formatDuration(minutes: number) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    }

    const totalMinutes = todayLogs.reduce((sum, log) => sum + log.durationMinutes, 0);

    return (
        <MainLayout>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold">Today's Work Log</h3>
                    <Badge bg="primary" className="fs-6">
                        Total Today: {formatDuration(totalMinutes)}
                    </Badge>
                </div>

                <Row>
                    {/* Log Entry Form */}
                    <Col lg={5}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-primary text-white">
                                <h5 className="mb-0">Add Work Log</h5>
                            </Card.Header>
                            <Card.Body>
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Date</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Task (Optional)</Form.Label>
                                        <Form.Select
                                            name="taskId"
                                            value={formData.taskId}
                                            onChange={handleChange}
                                        >
                                            <option value="">-- No Task Selected --</option>
                                            {tasks.map((task) => (
                                                <option key={task._id} value={task._id}>
                                                    {task.title} {task.projectId?.name && `(${task.projectId.name})`}
                                                </option>
                                            ))}
                                        </Form.Select>
                                        <Form.Text className="text-muted">
                                            Leave empty if work is not related to a specific task
                                        </Form.Text>
                                    </Form.Group>

                                    <Row>
                                        <Col>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Hours *</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="hours"
                                                    value={formData.hours}
                                                    onChange={handleChange}
                                                    min="0"
                                                    max="24"
                                                    placeholder="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col>
                                            <Form.Group className="mb-3">
                                                <Form.Label>Minutes *</Form.Label>
                                                <Form.Control
                                                    type="number"
                                                    name="minutes"
                                                    value={formData.minutes}
                                                    onChange={handleChange}
                                                    min="0"
                                                    max="59"
                                                    placeholder="0"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Notes</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleChange}
                                            placeholder="What did you work on?"
                                        />
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-100"
                                        disabled={loading}
                                    >
                                        {loading ? "Adding..." : "Add Work Log"}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Today's Logs */}
                    <Col lg={7}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-light">
                                <h5 className="mb-0">Today's Entries</h5>
                            </Card.Header>
                            <Card.Body className="p-0">
                                {todayLogs.length === 0 ? (
                                    <Alert variant="info" className="m-3">
                                        No work logs for today yet. Start logging your work!
                                    </Alert>
                                ) : (
                                    <div className="table-responsive">
                                        <Table hover className="mb-0">
                                            <thead className="bg-light">
                                                <tr>
                                                    <th>Task</th>
                                                    <th>Duration</th>
                                                    <th>Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {todayLogs.map((log) => (
                                                    <tr key={log._id}>
                                                        <td>
                                                            {log.taskId ? (
                                                                <span className="text-primary fw-500">
                                                                    {log.taskId.title}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted fst-italic">No task</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <Badge bg="light" text="dark" className="border">
                                                                {formatDuration(log.durationMinutes)}
                                                            </Badge>
                                                        </td>
                                                        <td className="text-muted small">
                                                            {log.notes || "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </MainLayout>
    );
}
