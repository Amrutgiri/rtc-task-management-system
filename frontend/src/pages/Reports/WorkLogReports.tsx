import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import MainLayout from "../../layout/MainLayout";
import { getWorkLogsSummary, getWorkLogsTrends, exportWorkLogsCSV } from "../../api/analytics";
import Swal from "sweetalert2";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function WorkLogReports() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<any>(null);
    const [trends, setTrends] = useState<any[]>([]);

    // Filters
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    async function fetchData() {
        try {
            setLoading(true);
            const params = { startDate, endDate };

            const [summaryRes, trendsRes] = await Promise.all([
                getWorkLogsSummary(params),
                getWorkLogsTrends(params)
            ]);

            setSummary(summaryRes.data);
            setTrends(trendsRes.data);
        } catch (error: any) {
            console.error("Failed to fetch reports:", error);
            Swal.fire("Error", "Failed to load work log reports", "error");
        } finally {
            setLoading(false);
        }
    }

    async function handleExport() {
        try {
            const response = await exportWorkLogsCSV({ startDate, endDate });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `worklogs_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Exported successfully",
                showConfirmButton: false,
                timer: 2000,
            });
        } catch (error) {
            Swal.fire("Error", "Failed to export work logs", "error");
        }
    }

    function setQuickFilter(days: number) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
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

    const totalHours = summary?.summary?.totalHours || 0;
    const totalLogs = summary?.summary?.totalLogs || 0;
    const avgHoursPerDay = trends.length > 0 ? totalHours / trends.length : 0;
    const topUser = summary?.byUser?.[0];
    const topProject = summary?.byProject?.[0];

    return (
        <MainLayout>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold">📊 Work Log Reports</h3>
                    <Button variant="success" onClick={handleExport}>
                        📥 Export CSV
                    </Button>
                </div>

                {/* Filters */}
                <Card className="mb-4 shadow-sm">
                    <Card.Body>
                        <Row className="g-3 align-items-end">
                            <Col md={3}>
                                <Form.Label>Start Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </Col>
                            <Col md={3}>
                                <Form.Label>End Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </Col>
                            <Col md={6}>
                                <div className="d-flex gap-2">
                                    <Button size="sm" variant="outline-primary" onClick={() => setQuickFilter(7)}>Last 7 Days</Button>
                                    <Button size="sm" variant="outline-primary" onClick={() => setQuickFilter(30)}>Last 30 Days</Button>
                                    <Button size="sm" variant="outline-primary" onClick={() => setQuickFilter(90)}>Last 90 Days</Button>
                                </div>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* Summary Cards */}
                <Row className="mb-4">
                    <Col md={3}>
                        <Card className="text-center shadow-sm border-0">
                            <Card.Body>
                                <h2 className="text-primary mb-0">{Math.round(totalHours)}h</h2>
                                <small className="text-muted">Total Hours Logged</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center shadow-sm border-0">
                            <Card.Body>
                                <h2 className="text-success mb-0">{Math.round(avgHoursPerDay * 10) / 10}h</h2>
                                <small className="text-muted">Average Hours/Day</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center shadow-sm border-0">
                            <Card.Body>
                                <h2 className="text-info mb-0">{topUser?.userName || "—"}</h2>
                                <small className="text-muted">Most Active User</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    <Col md={3}>
                        <Card className="text-center shadow-sm border-0">
                            <Card.Body>
                                <h2 className="text-warning mb-0">{topProject?.projectName || "—"}</h2>
                                <small className="text-muted">Most Active Project</small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Charts */}
                <Row className="mb-4">
                    {/* Time by User - Bar Chart */}
                    <Col md={6}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-primary text-white">
                                <strong>Time by User</strong>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={summary?.byUser || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="userName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="totalHours" fill="#0088FE" name="Hours" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Time by Project - Pie Chart */}
                    <Col md={6}>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-success text-white">
                                <strong>Time by Project</strong>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={summary?.byProject || []}
                                            dataKey="totalHours"
                                            nameKey="projectName"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={(entry) => `${entry.projectName}: ${Math.round(entry.totalHours)}h`}
                                        >
                                            {(summary?.byProject || []).map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Trend Chart */}
                <Row>
                    <Col>
                        <Card className="shadow-sm">
                            <Card.Header className="bg-info text-white">
                                <strong>Daily Trend</strong>
                            </Card.Header>
                            <Card.Body>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={trends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="totalHours" stroke="#8884d8" name="Hours" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </MainLayout>
    );
}
