import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, ProgressBar } from 'react-bootstrap';
import api from '../../api/axios';
import AdminLayout from '../../components/Admin/AdminLayout';

interface HealthData {
    status: string;
    database: string;
    memory: {
        used: string;
        total: string;
        percentage: number;
    };
    uptime: number;
    timestamp: string;
}

export default function SystemHealth() {
    const [health, setHealth] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHealth();
        const interval = setInterval(loadHealth, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    async function loadHealth() {
        try {
            const response = await api.get('/health');
            setHealth(response.data);
        } catch (error) {
            console.error('Failed to load health:', error);
        } finally {
            setLoading(false);
        }
    }

    function formatUptime(seconds: number): string {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    }

    if (loading) {
        return (
            <AdminLayout title="System Health">
                <div className="text-center py-5">Loading...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="System Health">
            <Container fluid>
                <Row>
                    <Col md={4}>
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h6 className="mb-0">Server Status</h6>
                                    <Badge bg={health?.status === 'healthy' ? 'success' : 'danger'}>
                                        {health?.status === 'healthy' ? '✓ Healthy' : '✗ Error'}
                                    </Badge>
                                </div>
                                <p className="text-muted mb-0">
                                    <i className="bi bi-server me-2"></i>
                                    All systems operational
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h6 className="mb-0">Database</h6>
                                    <Badge bg={health?.database === 'connected' ? 'success' : 'danger'}>
                                        {health?.database === 'connected' ? '✓ Connected' : '✗ Disconnected'}
                                    </Badge>
                                </div>
                                <p className="text-muted mb-0">
                                    <i className="bi bi-database me-2"></i>
                                    MongoDB Connection
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={4}>
                        <Card className="shadow-sm mb-4">
                            <Card.Body>
                                <h6 className="mb-3">Uptime</h6>
                                <h3 className="mb-0">{health && formatUptime(health.uptime)}</h3>
                                <p className="text-muted mb-0">
                                    <i className="bi bi-clock me-2"></i>
                                    Since last restart
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Card className="shadow-sm">
                    <Card.Body>
                        <h6 className="mb-3">Memory Usage</h6>
                        <div className="mb-2">
                            <div className="d-flex justify-content-between mb-1">
                                <span>
                                    {health?.memory.used} / {health?.memory.total}
                                </span>
                                <span className="text-muted">
                                    {health?.memory.percentage.toFixed(1)}%
                                </span>
                            </div>
                            <ProgressBar
                                now={health?.memory.percentage || 0}
                                variant={
                                    (health?.memory.percentage || 0) > 80 ? 'danger' :
                                        (health?.memory.percentage || 0) > 60 ? 'warning' : 'success'
                                }
                            />
                        </div>
                        <small className="text-muted">
                            Last updated: {health && new Date(health.timestamp).toLocaleString()}
                        </small>
                    </Card.Body>
                </Card>
            </Container>
        </AdminLayout>
    );
}
