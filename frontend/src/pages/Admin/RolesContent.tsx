import { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Badge, Modal, Form, Row, Col } from 'react-bootstrap';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import AdminLayout from '../../components/Admin/AdminLayout';

interface Role {
    _id: string;
    name: string;
    displayName: string;
    description: string;
    permissions: Array<{
        resource: string;
        actions: string[];
    }>;
    isSystem: boolean;
    isActive: boolean;
}

const RESOURCES = ['tasks', 'projects', 'users', 'worklogs', 'reports', 'settings', 'audit'];
const ACTIONS = ['create', 'read', 'update', 'delete', 'manage'];

export default function Roles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        displayName: '',
        description: '',
        permissions: [] as Array<{ resource: string; actions: string[] }>
    });

    useEffect(() => {
        loadRoles();
    }, []);

    async function loadRoles() {
        try {
            setLoading(true);
            const response = await api.get('/roles');
            setRoles(response.data);
        } catch (error: any) {
            Swal.fire('Error', error?.response?.data?.message || 'Failed to load roles', 'error');
        } finally {
            setLoading(false);
        }
    }

    function handleCreate() {
        setEditingRole(null);
        setFormData({
            name: '',
            displayName: '',
            description: '',
            permissions: []
        });
        setShowModal(true);
    }

    function handleEdit(role: Role) {
        setEditingRole(role);
        setFormData({
            name: role.name,
            displayName: role.displayName,
            description: role.description,
            permissions: role.permissions
        });
        setShowModal(true);
    }

    function handlePermissionToggle(resource: string, action: string) {
        const permissions = [...formData.permissions];
        const resourceIndex = permissions.findIndex(p => p.resource === resource);

        if (resourceIndex >= 0) {
            const actions = permissions[resourceIndex].actions;
            const actionIndex = actions.indexOf(action);

            if (actionIndex >= 0) {
                actions.splice(actionIndex, 1);
                if (actions.length === 0) {
                    permissions.splice(resourceIndex, 1);
                }
            } else {
                actions.push(action);
            }
        } else {
            permissions.push({ resource, actions: [action] });
        }

        setFormData({ ...formData, permissions });
    }

    function hasPermission(resource: string, action: string): boolean {
        const perm = formData.permissions.find(p => p.resource === resource);
        return perm?.actions.includes(action) || false;
    }

    async function handleSave() {
        try {
            if (!formData.displayName) {
                Swal.fire('Error', 'Display name is required', 'error');
                return;
            }

            if (editingRole) {
                await api.put(`/roles/${editingRole._id}`, formData);
                Swal.fire('Success', 'Role updated successfully', 'success');
            } else {
                if (!formData.name) {
                    Swal.fire('Error', 'Role name is required', 'error');
                    return;
                }
                await api.post('/roles', formData);
                Swal.fire('Success', 'Role created successfully', 'success');
            }

            setShowModal(false);
            loadRoles();
        } catch (error: any) {
            Swal.fire('Error', error?.response?.data?.message || 'Failed to save role', 'error');
        }
    }

    async function handleDelete(role: Role) {
        const result = await Swal.fire({
            title: 'Delete Role?',
            text: `Are you sure you want to delete "${role.displayName}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/roles/${role._id}`);
                Swal.fire('Deleted!', 'Role has been deleted.', 'success');
                loadRoles();
            } catch (error: any) {
                Swal.fire('Error', error?.response?.data?.message || 'Failed to delete role', 'error');
            }
        }
    }

    return (
        <Container fluid>
            <div className="d-flex justify-content-end mb-4">
                <Button variant="primary" onClick={handleCreate}>
                    <i className="bi bi-plus-circle me-2"></i>
                    Create Role
                </Button>
            </div>

            <Card className="shadow-sm">
                <Card.Body>
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : (
                        <Table striped hover responsive>
                            <thead>
                                <tr>
                                    <th>Role Name</th>
                                    <th>Description</th>
                                    <th>Permissions</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map((role) => (
                                    <tr key={role._id}>
                                        <td>
                                            <strong>{role.displayName}</strong>
                                            {role.isSystem && <Badge bg="secondary" className="ms-2">System</Badge>}
                                        </td>
                                        <td>{role.description || '—'}</td>
                                        <td>
                                            <small>
                                                {role.permissions.length} resource(s)
                                            </small>
                                        </td>
                                        <td>
                                            <Badge bg={role.isActive ? 'success' : 'secondary'}>
                                                {role.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button
                                                size="sm"
                                                variant="outline-primary"
                                                onClick={() => handleEdit(role)}
                                                className="me-2"
                                                disabled={role.isSystem}
                                            >
                                                <i className="bi bi-pencil"></i>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline-danger"
                                                onClick={() => handleDelete(role)}
                                                disabled={role.isSystem}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Create/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{editingRole ? 'Edit Role' : 'Create New Role'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Role Name (ID)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., project_manager"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={!!editingRole}
                                    />
                                    <Form.Text>Lowercase, no spaces</Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Display Name *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="e.g., Project Manager"
                                        value={formData.displayName}
                                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Form.Group className="mb-4">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Form.Group>

                        <h6 className="fw-bold mb-3">Permissions Matrix</h6>
                        <Table bordered size="sm">
                            <thead>
                                <tr>
                                    <th>Resource</th>
                                    {ACTIONS.map(action => (
                                        <th key={action} className="text-center text-capitalize">{action}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {RESOURCES.map(resource => (
                                    <tr key={resource}>
                                        <td className="text-capitalize fw-500">{resource}</td>
                                        {ACTIONS.map(action => (
                                            <td key={action} className="text-center">
                                                <Form.Check
                                                    type="checkbox"
                                                    checked={hasPermission(resource, action)}
                                                    onChange={() => handlePermissionToggle(resource, action)}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        {editingRole ? 'Update Role' : 'Create Role'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}
