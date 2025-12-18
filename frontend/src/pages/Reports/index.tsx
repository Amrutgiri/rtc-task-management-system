import { Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layout/MainLayout";

export default function Reports() {
    const navigate = useNavigate();

    const reports = [
        {
            title: "📊 Work Log Reports",
            description: "View time logged by users and projects with detailed analytics",
            path: "/reports/worklogs",
            icon: "⏱️",
            color: "primary"
        },
        {
            title: "📁 Project Reports",
            description: "Track project progress, task completion, and health metrics",
            path: "/reports/projects",
            icon: "📈",
            color: "success"
        },
        {
            title: "👥 Productivity Reports",
            description: "Analyze user productivity, tasks completed, and performance trends",
            path: "/reports/productivity",
            icon: "🏆",
            color: "info"
        }
    ];

    return (
        <MainLayout>
            <Container fluid>
                <div className="mb-4">
                    <h3 className="fw-bold">📊 Reports & Analytics</h3>
                    <p className="text-muted">Choose a report type to view detailed analytics</p>
                </div>

                <Row>
                    {reports.map((report, index) => (
                        <Col md={4} key={index} className="mb-4">
                            <Card
                                className="h-100 shadow-sm"
                                style={{ cursor: "pointer", transition: "transform 0.2s" }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}
                                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                                onClick={() => navigate(report.path)}
                            >
                                <Card.Header className={`bg-${report.color} text-white text-center`}>
                                    <div style={{ fontSize: "3rem" }}>{report.icon}</div>
                                </Card.Header>
                                <Card.Body className="text-center">
                                    <Card.Title>{report.title}</Card.Title>
                                    <Card.Text className="text-muted">
                                        {report.description}
                                    </Card.Text>
                                </Card.Body>
                                <Card.Footer className="text-center">
                                    <small className="text-primary">Click to view →</small>
                                </Card.Footer>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>
        </MainLayout>
    );
}
