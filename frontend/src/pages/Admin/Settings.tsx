import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Alert, Spinner, InputGroup } from 'react-bootstrap';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import AdminLayout from '../../components/Admin/AdminLayout';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [testingEmail, setTestingEmail] = useState(false);
    const [testEmail, setTestEmail] = useState('');

    const [generalSettings, setGeneralSettings] = useState({
        appName: '',
        companyName: '',
        supportEmail: '',
        maintenanceMode: false,
        allowRegistration: true,
    });

    const [emailSettings, setEmailSettings] = useState({
        smtpHost: '',
        smtpPort: 587,
        smtpSecure: false,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: '',
        fromName: 'TMS Notifications',
    });

    const [defaultSettings, setDefaultSettings] = useState({
        taskPriority: 'medium',
        taskStatus: 'open',
        dateFormat: 'MM/DD/YYYY',
        timeZone: 'UTC',
    });

    const [featureSettings, setFeatureSettings] = useState({
        enableFileUploads: false,
        enableRealtimeUpdates: true,
        enableEmailNotifications: false,
        enableAuditLog: true,
        enableTaskTemplates: false,
    });

    const [securitySettings, setSecuritySettings] = useState({
        minPasswordLength: 8,
        requireSpecialChar: true,
        sessionTimeout: 60,
        maxLoginAttempts: 5
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setFetching(true);
            const res = await api.get('/system-settings');
            const { general, email, defaults, features, security } = res.data;
            if (general) setGeneralSettings(general);
            if (email) setEmailSettings(email);
            if (defaults) setDefaultSettings(defaults);
            if (features) setFeatureSettings(features);
            if (security) setSecuritySettings(security);
        } catch (error) {
            console.error("Failed to load settings:", error);
            Swal.fire("Error", "Failed to load system settings", "error");
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/system-settings', {
                general: generalSettings,
                email: emailSettings,
                defaults: defaultSettings,
                features: featureSettings,
                security: securitySettings
            });

            Swal.fire({
                icon: 'success',
                title: 'Settings Saved',
                text: 'System configurations have been updated successfully.',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Failed to save settings:", error);
            Swal.fire("Error", "Failed to save settings", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmail) {
            Swal.fire("Error", "Please enter a test email address", "error");
            return;
        }

        setTestingEmail(true);
        try {
            const response = await api.post('/system-settings/test-email', {
                testEmailAddress: testEmail
            });

            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Test Email Sent!',
                    text: response.data.message,
                });
            }
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Test Failed',
                text: error?.response?.data?.message || 'Failed to send test email'
            });
        } finally {
            setTestingEmail(false);
        }
    };

    if (fetching) {
        return (
            <AdminLayout title="System Settings">
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Loading configuration...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="System Settings">
            <Container fluid className="py-4">
                <Row className="justify-content-center">
                    <Col lg={10}>
                        <Card className="shadow-sm border-0">
                            <Card.Body>
                                <Tabs
                                    activeKey={activeTab}
                                    onSelect={(k) => setActiveTab(k || 'general')}
                                    className="mb-4"
                                >
                                    {/* GENERAL */}
                                    <Tab eventKey="general" title="General">
                                        <h5 className="mb-4 text-primary fw-bold">General Configuration</h5>
                                        <Form>
                                            <Row className="mb-3">
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Application Name</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={generalSettings.appName}
                                                            onChange={(e) => setGeneralSettings({ ...generalSettings, appName: e.target.value })}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Company Name</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={generalSettings.companyName}
                                                            onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Form.Group className="mb-3">
                                                <Form.Label>Support Email</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    value={generalSettings.supportEmail}
                                                    onChange={(e) => setGeneralSettings({ ...generalSettings, supportEmail: e.target.value })}
                                                />
                                            </Form.Group>

                                            <hr className="my-4" />
                                            <h6 className="fw-bold mb-3">System Access</h6>

                                            <Form.Check
                                                type="switch"
                                                id="maintenance-mode"
                                                label="Maintenance Mode (Only Admins can login)"
                                                checked={generalSettings.maintenanceMode}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, maintenanceMode: e.target.checked })}
                                                className="mb-3"
                                            />

                                            <Form.Check
                                                type="switch"
                                                id="allow-registration"
                                                label="Allow New User Registrations"
                                                checked={generalSettings.allowRegistration}
                                                onChange={(e) => setGeneralSettings({ ...generalSettings, allowRegistration: e.target.checked })}
                                            />
                                        </Form>
                                    </Tab>

                                    {/* EMAIL/SMTP */}
                                    <Tab eventKey="email" title="Email / SMTP">
                                        <h5 className="mb-4 text-primary fw-bold">Email Configuration</h5>
                                        <Alert variant="info" className="mb-4">
                                            <i className="bi bi-envelope me-2"></i>
                                            Configure SMTP settings to enable email notifications
                                        </Alert>

                                        <Form>
                                            <Row>
                                                <Col md={8}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>SMTP Host</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="smtp.gmail.com"
                                                            value={emailSettings.smtpHost}
                                                            onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={4}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>SMTP Port</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            value={emailSettings.smtpPort}
                                                            onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: parseInt(e.target.value) })}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>SMTP Username</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={emailSettings.smtpUser}
                                                            onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>SMTP Password</Form.Label>
                                                        <Form.Control
                                                            type="password"
                                                            value={emailSettings.smtpPassword}
                                                            onChange={(e) => setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>From Email</Form.Label>
                                                        <Form.Control
                                                            type="email"
                                                            placeholder="noreply@example.com"
                                                            value={emailSettings.fromEmail}
                                                            onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>From Name</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            value={emailSettings.fromName}
                                                            onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Form.Check
                                                type="switch"
                                                id="smtp-secure"
                                                label="Use SSL/TLS (port 465)"
                                                checked={emailSettings.smtpSecure}
                                                onChange={(e) => setEmailSettings({ ...emailSettings, smtpSecure: e.target.checked })}
                                                className="mb-4"
                                            />

                                            <hr className="my-4" />
                                            <h6 className="fw-bold mb-3">Test Email Configuration</h6>
                                            <InputGroup>
                                                <Form.Control
                                                    type="email"
                                                    placeholder="Enter test email address"
                                                    value={testEmail}
                                                    onChange={(e) => setTestEmail(e.target.value)}
                                                />
                                                <Button
                                                    variant="outline-primary"
                                                    onClick={handleTestEmail}
                                                    disabled={testingEmail}
                                                >
                                                    {testingEmail ? 'Sending...' : 'Send Test Email'}
                                                </Button>
                                            </InputGroup>
                                        </Form>
                                    </Tab>

                                    {/* SYSTEM DEFAULTS */}
                                    <Tab eventKey="defaults" title="System Defaults">
                                        <h5 className="mb-4 text-primary fw-bold">Default Settings</h5>
                                        <p className="text-muted mb-4">Set default values for tasks and system preferences</p>

                                        <Form>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Default Task Priority</Form.Label>
                                                        <Form.Select
                                                            value={defaultSettings.taskPriority}
                                                            onChange={(e) => setDefaultSettings({ ...defaultSettings, taskPriority: e.target.value })}
                                                        >
                                                            <option value="low">Low</option>
                                                            <option value="medium">Medium</option>
                                                            <option value="high">High</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Default Task Status</Form.Label>
                                                        <Form.Select
                                                            value={defaultSettings.taskStatus}
                                                            onChange={(e) => setDefaultSettings({ ...defaultSettings, taskStatus: e.target.value })}
                                                        >
                                                            <option value="open">Open</option>
                                                            <option value="in-progress">In Progress</option>
                                                            <option value="review">Review</option>
                                                            <option value="completed">Completed</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Date Format</Form.Label>
                                                        <Form.Select
                                                            value={defaultSettings.dateFormat}
                                                            onChange={(e) => setDefaultSettings({ ...defaultSettings, dateFormat: e.target.value })}
                                                        >
                                                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Time Zone</Form.Label>
                                                        <Form.Select
                                                            value={defaultSettings.timeZone}
                                                            onChange={(e) => setDefaultSettings({ ...defaultSettings, timeZone: e.target.value })}
                                                        >
                                                            <option value="UTC">UTC</option>
                                                            <option value="America/New_York">Eastern Time</option>
                                                            <option value="America/Chicago">Central Time</option>
                                                            <option value="America/Los_Angeles">Pacific Time</option>
                                                            <option value="Asia/Kolkata">India Standard Time</option>
                                                        </Form.Select>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Form>
                                    </Tab>

                                    {/* FEATURE TOGGLES */}
                                    <Tab eventKey="features" title="Feature Toggles">
                                        <h5 className="mb-4 text-primary fw-bold">Application Features</h5>
                                        <p className="text-muted mb-4">Enable or disable system-wide features</p>

                                        <Form>
                                            <Form.Check
                                                type="switch"
                                                id="feature-files"
                                                label={<><strong>File Uploads</strong> - Allow users to attach files to tasks</>}
                                                checked={featureSettings.enableFileUploads}
                                                onChange={(e) => setFeatureSettings({ ...featureSettings, enableFileUploads: e.target.checked })}
                                                className="mb-3"
                                            />

                                            <Form.Check
                                                type="switch"
                                                id="feature-realtime"
                                                label={<><strong>Real-time Updates</strong> - Live updates for tasks and notifications</>}
                                                checked={featureSettings.enableRealtimeUpdates}
                                                onChange={(e) => setFeatureSettings({ ...featureSettings, enableRealtimeUpdates: e.target.checked })}
                                                className="mb-3"
                                            />

                                            <Form.Check
                                                type="switch"
                                                id="feature-email-notif"
                                                label={<><strong>Email Notifications</strong> - Send email alerts for important events</>}
                                                checked={featureSettings.enableEmailNotifications}
                                                onChange={(e) => setFeatureSettings({ ...featureSettings, enableEmailNotifications: e.target.checked })}
                                                className="mb-3"
                                            />

                                            <Form.Check
                                                type="switch"
                                                id="feature-audit"
                                                label={<><strong>Audit Log</strong> - Track all user actions for compliance</>}
                                                checked={featureSettings.enableAuditLog}
                                                onChange={(e) => setFeatureSettings({ ...featureSettings, enableAuditLog: e.target.checked })}
                                                className="mb-3"
                                            />

                                            <Form.Check
                                                type="switch"
                                                id="feature-templates"
                                                label={<><strong>Task Templates</strong> - Create reusable task templates</>}
                                                checked={featureSettings.enableTaskTemplates}
                                                onChange={(e) => setFeatureSettings({ ...featureSettings, enableTaskTemplates: e.target.checked })}
                                                className="mb-3"
                                            />
                                        </Form>
                                    </Tab>

                                    {/* SECURITY */}
                                    <Tab eventKey="security" title="Security">
                                        <h5 className="mb-4 text-primary fw-bold">Security Policies</h5>
                                        <Alert variant="info" className="mb-4">
                                            <i className="bi bi-shield-lock me-2"></i>
                                            Changes to security settings will apply to all users upon their next login.
                                        </Alert>

                                        <Form>
                                            <Row>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Minimum Password Length</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            value={securitySettings.minPasswordLength}
                                                            onChange={(e) => setSecuritySettings({ ...securitySettings, minPasswordLength: parseInt(e.target.value) })}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group className="mb-3">
                                                        <Form.Label>Session Timeout (Minutes)</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            value={securitySettings.sessionTimeout}
                                                            onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>

                                            <Form.Check
                                                type="checkbox"
                                                id="require-special"
                                                label="Require Special Characters in Password"
                                                checked={securitySettings.requireSpecialChar}
                                                onChange={(e) => setSecuritySettings({ ...securitySettings, requireSpecialChar: e.target.checked })}
                                                className="mb-3"
                                            />

                                            <Form.Group className="mb-3">
                                                <Form.Label>Max Login Attempts (before lockout)</Form.Label>
                                                <Form.Select
                                                    value={securitySettings.maxLoginAttempts}
                                                    onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) })}
                                                >
                                                    <option value="3">3 Attempts</option>
                                                    <option value="5">5 Attempts</option>
                                                    <option value="10">10 Attempts</option>
                                                </Form.Select>
                                            </Form.Group>
                                        </Form>
                                    </Tab>
                                </Tabs>

                                <div className="d-flex justify-content-end mt-4">
                                    <Button variant="secondary" className="me-2" onClick={() => loadSettings()}>
                                        Reset
                                    </Button>
                                    <Button variant="primary" onClick={handleSave} disabled={loading}>
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </AdminLayout>
    );
}
