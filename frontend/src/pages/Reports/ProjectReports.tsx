import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import MainLayout from "../../layout/MainLayout";
import { getProjectsProgress, getProjectsHealth } from "../../api/analytics";
import { getProjects } from "../../api/projects";
import Swal from "sweetalert2";

export default function ProjectReports() {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [progress, setProgress] = useState<any[]>([]);
    const [health, setHealth] = useState<any[]>([]);
    const [selectedProject, setSelectedProject] = useState("");

    useEffect(() => {
        loadProjects();
        fetchData();
    }, []);

    useEffect(() => {
        fetchData();
    }, [selectedProject]);

    async function loadProjects() {
        try {
            const res = await getProjects();
            setProjects(res.data.data || res.data || []);
        } catch (error) {
            console.error("Failed to load projects:", error);
        }
    }

    async function fetchData() {
        try {
            setLoading(true);
            const params = selectedProject ? { projectId: selectedProject } : {};

            const [progressRes, healthRes] = await Promise.all([
                getProjectsProgress(params),
                getProjectsHealth(params)
            ]);

            setProgress(progressRes.data);
            setHealth(healthRes.data);
        } catch (error: any) {
            console.error("Failed to fetch reports:", error);
            Swal.fire("Error", "Failed to load project reports", "error");
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <MainLayout>
                <Container>
                    <div className="text-center mt-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </Container>
            </MainLayout>
        );
    }

    // Prepare data for stacked bar chart
    const chartData = progress.map(p => ({
        name: p.projectName.length > 15 ? p.projectName.substring(0, 15) + '...' : p.projectName,
        Open: p.taskStats.open,
        'In Progress': p.taskStats['in-progress'],
        Review: p.taskStats.review,
        Completed: p.taskStats.completed
    }));

    return (
        <MainLayout>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold">📁 Project Reports</h3>
                </div>

                {/* Filter */}
                <Card className="mb-4 shadow-sm">
                    <Card.Body>
                        <Row>
                            <Col md={4}>
                                <Form.Label>Select Project</Form.Label>
                                <Form.Select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                >
                                    <option value="">All Projects</option>
                                    {projects.map((p) => (
                                        <option key={p._id} value={p._id}>{p.name}</option>
                                    ))}
                                </Form.Select>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Task Status Distribution Chart */}
                <Row className="mb-4">
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-primary text-white">
                                <strong>Task Status Distribution by Project</strong>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="Open" stackId="a" fill="#6c757d" />
                                        <Bar dataKey="In Progress" stackId="a" fill="#0d6efd" />
                                        <Bar dataKey="Review" stackId="a" fill="#ffc107" />
                                        <Bar dataKey="Completed" stackId="a" fill="#198754" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Project Health Cards */}
                <Row>
                    {health.map((proj) => (
                        <Col md={4} key={proj.projectId} className="mb-4">
                            <Card className="shadow-sm h-100">
                                <Card.Header className={`text-white ${proj.health === 'Good' ? 'bg-success' :
                                        proj.health === 'Fair' ? 'bg-warning' : 'bg-danger'
                                    }`}>
                                    <strong>{proj.projectName}</strong>
                                </Card.Header>
                                <Card.Body>
                                    <div className="mb-3">
                                        <h4 className="text-center mb-0">{proj.health}</h4>
                                        <div className="text-muted text-center small">Health Status</div>
                                    </div>

                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Total Tasks:</span>
                                        <strong>{proj.totalTasks}</strong>
                                    </div>

                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Completed:</span>
                                        <strong className="text-success">{proj.completedTasks}</strong>
                                    </div>

                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Overdue:</span>
                                        <strong className="text-danger">{proj.overdueTasks}</strong>
                                    </div>

                                    <div className="mt-3">
                                        <div className="d-flex justify-content-between small mb-1">
                                            <span>Completion Rate</span>
                                            <span>{proj.completionRate}%</span>
                                        </div>
                                        <div className="progress">
                                            <div
                                                className="progress-bar bg-success"
                                                role="progressbar"
                                                style={{ width: `${proj.completionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </MainLayout>
    );
}
