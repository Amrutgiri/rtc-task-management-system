import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Table } from "react-bootstrap";
import AdminLayout from "../../components/Admin/AdminLayout";
import { TrendingUp, FileText, CheckCircle, Clock } from "lucide-react";
import { getAnalyticsSummary, getWorkStats } from "../../api/analytics";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [workStats, setWorkStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [summaryRes, workRes] = await Promise.all([
        getAnalyticsSummary(),
        getWorkStats(),
      ]);
      setSummary(summaryRes.data);
      setWorkStats(workRes.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Analytics">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
          <Spinner animation="border" variant="primary" />
        </div>
      </AdminLayout>
    );
  }

  const stats = [
    {
      title: "Total Tasks",
      value: summary?.totalTasks || 0,
      icon: FileText,
      color: "primary",
      bg: "rgba(59, 130, 246, 0.1)",
    },
    {
      title: "Completed Tasks",
      value: summary?.completedTasks || 0,
      icon: CheckCircle,
      color: "success",
      bg: "rgba(16, 185, 129, 0.1)",
    },
    {
      title: "Total Hours Logged",
      value: workStats?.totalHours || 0,
      icon: Clock,
      color: "info",
      bg: "rgba(6, 182, 212, 0.1)",
    },
    {
      title: "Completion Rate",
      value: `${summary?.completionRate || 0}%`,
      icon: TrendingUp,
      color: "warning",
      bg: "rgba(245, 158, 11, 0.1)",
    },
  ];

  // Prepare Chart Data
  const statusData = {
    labels: Object.keys(summary?.charts?.tasksByStatus || {}).map(s => s.toUpperCase()),
    datasets: [
      {
        label: '# of Tasks',
        data: Object.values(summary?.charts?.tasksByStatus || {}),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const projectData = {
    labels: summary?.charts?.tasksByProject?.map((p: any) => p.name) || [],
    datasets: [
      {
        label: 'Tasks per Project',
        data: summary?.charts?.tasksByProject?.map((p: any) => p.count) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  return (
    <AdminLayout title="Analytics">
      <Container fluid>
        {/* KPI Cards */}
        <Row className="mb-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Col md={6} lg={3} key={idx} className="mb-3">
                <Card className="shadow-sm border-0 h-100">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <p className="text-muted mb-1 fw-500">{stat.title}</p>
                        <h3 className="mb-0 fw-bold">{stat.value}</h3>
                      </div>
                      <div
                        style={{
                          padding: "12px",
                          borderRadius: "12px",
                          backgroundColor: stat.bg,
                        }}
                      >
                        <Icon size={24} className={`text-${stat.color}`} />
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Charts Row */}
        <Row className="mb-4">
          <Col md={6} className="mb-3">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0 fw-bold">Tasks by Status</h5>
              </Card.Header>
              <Card.Body className="d-flex justify-content-center">
                <div style={{ width: '300px' }}>
                  <Pie data={statusData} />
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} className="mb-3">
            <Card className="shadow-sm border-0 h-100">
              <Card.Header className="bg-white">
                <h5 className="mb-0 fw-bold">Tasks per Project</h5>
              </Card.Header>
              <Card.Body>
                <Bar
                  data={projectData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' as const } },
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Recent Activity / Work Logs */}
          <Col lg={12} className="mb-4">
            <Card className="shadow-sm border-0">
              <Card.Header className="bg-white border-bottom py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <Card.Title className="mb-0 fw-bold">Recent Activity</Card.Title>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                <Table hover responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 ps-4">User</th>
                      <th className="border-0">Task</th>
                      <th className="border-0">Date</th>
                      <th className="border-0">Duration</th>
                      <th className="border-0">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.recentActivity?.length > 0 ? (
                      summary.recentActivity.map((log: any, i: number) => (
                        <tr key={i}>
                          <td className="ps-4 fw-bold">
                            {log.userId?.name || "Unknown User"}
                          </td>
                          <td className="fw-500">
                            {log.taskId?.title || "Unknown Task"}
                          </td>
                          <td className="text-muted">
                            {new Date(log.date).toLocaleDateString()}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                            </span>
                          </td>
                          <td className="text-muted small">
                            {log.notes || "-"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted">
                          No recent activity found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </AdminLayout>
  );
}
