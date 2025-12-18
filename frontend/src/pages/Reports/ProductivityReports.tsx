import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form } from "react-bootstrap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import MainLayout from "../../layout/MainLayout";
import { getUsersProductivity } from "../../api/analytics";
import Swal from "sweetalert2";

export default function ProductivityReports() {
    const [loading, setLoading] = useState(true);
    const [productivity, setProductivity] = useState<any[]>([]);
    const [period, setPeriod] = useState("30");

    useEffect(() => {
        fetchData();
    }, [period]);

    async function fetchData() {
        try {
            setLoading(true);
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(period));

            const params = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            };

            const res = await getUsersProductivity(params);
            setProductivity(res.data);
        } catch (error: any) {
            console.error("Failed to fetch productivity:", error);
            Swal.fire("Error", "Failed to load productivity reports", "error");
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

    return (
        <MainLayout>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold">👥 User Productivity Reports</h3>
                </div>

                {/* Filter */}
                <Card className="mb-4 shadow-sm">
                    <Card.Body>
                        <Row>
                            <Col md={3}>
                                <Form.Label>Time Period</Form.Label>
                                <Form.Select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                >
                                    <option value="7">Last 7 Days</option>
                                    <option value="30">Last 30 Days</option>
                                    <option value="90">Last 90 Days</option>
                                </Form.Select>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Charts */}
                <Row className="mb-4">
                    {/* Tasks Completed */}
                    <Col md={6}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-primary text-white">
                                <strong>Tasks Completed by User</strong>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={productivity}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="userName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="tasksCompleted" fill="#0d6efd" name="Tasks" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Hours Logged */}
                    <Col md={6}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-success text-white">
                                <strong>Hours Logged by User</strong>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={productivity}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="userName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="hoursLogged" fill="#198754" name="Hours" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Leaderboard */}
                <Row>
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-warning text-dark">
                                <strong>🏆 Top Performers</strong>
                            </Card.Header>
                            <Card.Body>
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>User</th>
                                                <th className="text-center">Tasks Completed</th>
                                                <th className="text-center">Hours Logged</th>
                                                <th className="text-center">Avg Hours/Task</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productivity.map((user, index) => (
                                                <tr key={user.userId}>
                                                    <td>
                                                        {index === 0 && "🥇"}
                                                        {index === 1 && "🥈"}
                                                        {index === 2 && "🥉"}
                                                        {index > 2 && index + 1}
                                                    </td>
                                                    <td>
                                                        <strong>{user.userName}</strong>
                                                        <br />
                                                        <small className="text-muted">{user.userEmail}</small>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-primary">{user.tasksCompleted}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-success">{user.hoursLogged}h</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-info">{user.avgHoursPerTask}h</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </MainLayout>
    );
}
