import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import Swal from 'sweetalert2';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Spinner, ListGroup } from 'react-bootstrap';
import MainLayout from '../layout/MainLayout';

export default function NotificationSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notification-settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
      Swal.fire('Error', 'Failed to load notification settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Update settings
  const updateSettings = async () => {
    try {
      setSaving(true);
      await api.patch('/notification-settings', settings);
      Swal.fire('Success', 'Settings updated successfully', 'success');
    } catch (err) {
      console.error('Error updating settings:', err);
      Swal.fire('Error', 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Handle checkbox changes
  const handleCheckChange = (field) => {
    setSettings({
      ...settings,
      [field]: !settings[field],
    });
  };

  // Handle notification type changes
  const handleNotificationTypeChange = (type) => {
    setSettings({
      ...settings,
      notificationTypes: {
        ...settings.notificationTypes,
        [type]: !settings.notificationTypes[type],
      },
    });
  };

  // Handle quiet hours change
  const handleQuietHoursChange = (field, value) => {
    setSettings({
      ...settings,
      quietHours: {
        ...settings.quietHours,
        [field]: value,
      },
    });
  };

  // Handle frequency change
  const handleFrequencyChange = (value) => {
    setSettings({
      ...settings,
      frequency: value,
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <Container className="py-5 text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </Container>
      </MainLayout>
    );
  }

  if (!settings) {
    return (
      <MainLayout>
        <Container className="py-5">
          <Alert variant="danger">Failed to load settings</Alert>
        </Container>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Container className="py-4" style={{ maxWidth: '700px' }}>
        <h1 className="mb-4">
          <i className="bi bi-gear-fill me-2"></i>
          Notification Settings
        </h1>

        {/* Global Notification Controls */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <i className="bi bi-toggles me-2"></i>
              Global Controls
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="mb-3">
              <Form.Check
                type="switch"
                id="emailNotif"
                label="Email Notifications"
                checked={settings.emailNotifications}
                onChange={() => handleCheckChange('emailNotifications')}
              />
              <small className="text-muted d-block mt-1">
                Receive email notifications for important events
              </small>
            </div>

            <div className="mb-3">
              <Form.Check
                type="switch"
                id="pushNotif"
                label="Browser Push Notifications"
                checked={settings.pushNotifications}
                onChange={() => handleCheckChange('pushNotifications')}
              />
              <small className="text-muted d-block mt-1">
                Get browser push notifications in real-time
              </small>
            </div>

            <div className="mb-0">
              <Form.Check
                type="switch"
                id="soundAlerts"
                label="Sound Alerts"
                checked={settings.soundAlerts}
                onChange={() => handleCheckChange('soundAlerts')}
              />
              <small className="text-muted d-block mt-1">
                Play sound when new notifications arrive
              </small>
            </div>
          </Card.Body>
        </Card>

        {/* Notification Frequency */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <i className="bi bi-clock-history me-2"></i>
              Notification Frequency
            </h6>
          </Card.Header>
          <Card.Body>
            <Form.Check
              type="radio"
              name="frequency"
              label="Immediate - Get notified right away"
              value="immediate"
              checked={settings.frequency === 'immediate'}
              onChange={(e) => handleFrequencyChange(e.target.value)}
              className="mb-3"
            />
            <Form.Check
              type="radio"
              name="frequency"
              label="Daily Digest - Get one email per day"
              value="daily"
              checked={settings.frequency === 'daily'}
              onChange={(e) => handleFrequencyChange(e.target.value)}
              className="mb-3"
            />
            <Form.Check
              type="radio"
              name="frequency"
              label="Never - Disable all notifications"
              value="never"
              checked={settings.frequency === 'never'}
              onChange={(e) => handleFrequencyChange(e.target.value)}
              className="mb-0"
            />
          </Card.Body>
        </Card>

        {/* Notification Types */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <i className="bi bi-funnel me-2"></i>
              Notification Types
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="mb-3">
              <Form.Check
                type="checkbox"
                id="taskAssigned"
                label="Task Assigned to Me"
                checked={settings.notificationTypes.taskAssigned}
                onChange={() => handleNotificationTypeChange('taskAssigned')}
              />
            </div>

            <div className="mb-3">
              <Form.Check
                type="checkbox"
                id="taskCommented"
                label="Task I'm Working On Commented"
                checked={settings.notificationTypes.taskCommented}
                onChange={() => handleNotificationTypeChange('taskCommented')}
              />
            </div>

            <div className="mb-3">
              <Form.Check
                type="checkbox"
                id="taskStatusChanged"
                label="Task Status Changed"
                checked={settings.notificationTypes.taskStatusChanged}
                onChange={() => handleNotificationTypeChange('taskStatusChanged')}
              />
            </div>

            <div className="mb-3">
              <Form.Check
                type="checkbox"
                id="projectUpdated"
                label="Project Updated"
                checked={settings.notificationTypes.projectUpdated}
                onChange={() => handleNotificationTypeChange('projectUpdated')}
              />
            </div>

            <div className="mb-0">
              <Form.Check
                type="checkbox"
                id="mentioned"
                label="Mentioned in Comments"
                checked={settings.notificationTypes.mentionedInComment}
                onChange={() => handleNotificationTypeChange('mentionedInComment')}
              />
            </div>
          </Card.Body>
        </Card>

        {/* Quiet Hours */}
        <Card className="mb-4">
          <Card.Header className="bg-light">
            <h6 className="mb-0">
              <i className="bi bi-moon me-2"></i>
              Do Not Disturb Hours
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="mb-3">
              <Form.Check
                type="switch"
                id="quietHoursEnabled"
                label="Enable Do Not Disturb"
                checked={settings.quietHours.enabled}
                onChange={(e) =>
                  handleQuietHoursChange('enabled', e.target.checked)
                }
              />
              <small className="text-muted d-block mt-1">
                No notifications will be shown during these hours (but will be saved)
              </small>
            </div>

            {settings.quietHours.enabled && (
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Start Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={settings.quietHours.startTime}
                      onChange={(e) =>
                        handleQuietHoursChange('startTime', e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">End Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={settings.quietHours.endTime}
                      onChange={(e) =>
                        handleQuietHoursChange('endTime', e.target.value)
                      }
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        {/* Muted Items Summary */}
        {(settings.mutedProjects?.length > 0 ||
          settings.mutedTasks?.length > 0 ||
          settings.mutedUsers?.length > 0) && (
          <Card className="mb-4 border-warning">
            <Card.Header className="bg-light">
              <h6 className="mb-0">
                <i className="bi bi-volume-mute me-2"></i>
                Muted Items
              </h6>
            </Card.Header>
            <Card.Body>
              {settings.mutedProjects?.length > 0 && (
                <div className="mb-3">
                  <strong className="small">Muted Projects:</strong>
                  <div className="mt-2">
                    {settings.mutedProjects.map((proj) => (
                      <Badge key={proj._id} bg="warning" text="dark" className="me-2 mb-2">
                        <i className="bi bi-folder me-1"></i>
                        {proj.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {settings.mutedTasks?.length > 0 && (
                <div className="mb-3">
                  <strong className="small">Muted Tasks:</strong>
                  <div className="mt-2">
                    {settings.mutedTasks.map((task) => (
                      <Badge key={task._id} bg="warning" text="dark" className="me-2 mb-2">
                        <i className="bi bi-check2-square me-1"></i>
                        {task.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {settings.mutedUsers?.length > 0 && (
                <div className="mb-0">
                  <strong className="small">Muted Users:</strong>
                  <div className="mt-2">
                    {settings.mutedUsers.map((mutedUser) => (
                      <Badge key={mutedUser._id} bg="warning" text="dark" className="me-2 mb-2">
                        <i className="bi bi-person me-1"></i>
                        {mutedUser.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        {/* Info Alert */}
        <Alert variant="info" className="mb-4">
          <i className="bi bi-info-circle me-2"></i>
          Manage which notifications you want to receive and when. You can also mute
          specific projects and tasks from their detail pages.
        </Alert>

        {/* Save Button */}
        <div className="d-grid gap-2 d-md-flex justify-content-md-end">
          <Button
            variant="secondary"
            onClick={() => fetchSettings()}
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={updateSettings}
            disabled={saving}
          >
            {saving && (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
              </>
            )}
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </Container>
    </MainLayout>
  );
}
