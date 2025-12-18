import { useState } from 'react';
import { Container, Card, Button, Form, Alert } from 'react-bootstrap';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import AdminLayout from '../../components/Admin/AdminLayout';

export default function BulkImport() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'users' | 'tasks'>('users');
    const [uploading, setUploading] = useState(false);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    }

    async function handleImport() {
        if (!selectedFile) {
            Swal.fire('Error', 'Please select a CSV file first', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        setUploading(true);
        try {
            const endpoint = importType === 'users' ? '/import/users' : '/import/tasks';
            const response = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Swal.fire({
                icon: 'success',
                title: 'Import Successful!',
                html: `<div>
          <p><strong>${response.data.imported || 0}</strong> records imported successfully</p>
          ${response.data.errors?.length > 0 ? `<p class="text-warning">${response.data.errors.length} errors</p>` : ''}
        </div>`
            });

            setSelectedFile(null);
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'Import Failed',
                text: error?.response?.data?.message || 'Failed to import CSV file'
            });
        } finally {
            setUploading(false);
        }
    }

    function downloadTemplate() {
        const templates = {
            users: 'name,email,role,password\nJohn Doe,john@example.com,developer,Pass123\nJane Smith,jane@example.com,manager,Pass456',
            tasks: 'title,description,priority,status,projectId,assigneeEmail\nFix Bug,Fix login issue,high,open,PROJECT_ID,dev@example.com'
        };

        const blob = new Blob([templates[importType]], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${importType}_template.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <AdminLayout title="Bulk Import">
            <Container fluid>
                <Card className="shadow-sm">
                    <Card.Body>
                        <Alert variant="info">
                            <i className="bi bi-info-circle me-2"></i>
                            Upload a CSV file to bulk import records. Download the template for the correct format.
                        </Alert>

                        <Form>
                            <Form.Group className="mb-4">
                                <Form.Label>Import Type</Form.Label>
                                <Form.Select
                                    value={importType}
                                    onChange={(e) => setImportType(e.target.value as 'users' | 'tasks')}
                                >
                                    <option value="users">Users</option>
                                    <option value="tasks">Tasks</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-4">
                                <Form.Label>CSV File</Form.Label>
                                <Form.Control
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                />
                                {selectedFile && (
                                    <small className="text-success">
                                        <i className="bi bi-check-circle me-1"></i>
                                        {selectedFile.name} selected
                                    </small>
                                )}
                            </Form.Group>

                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-secondary"
                                    onClick={downloadTemplate}
                                >
                                    <i className="bi bi-download me-2"></i>
                                    Download Template
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleImport}
                                    disabled={!selectedFile || uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-upload me-2"></i>
                                            Import CSV
                                        </>
                                    )}
                                </Button>
                            </div>
                        </Form>

                        <hr className="my-4" />

                        <h6 className="fw-bold mb-3">CSV Format Requirements</h6>
                        {importType === 'users' ? (
                            <ul>
                                <li><strong>name</strong>: Full name of the user</li>
                                <li><strong>email</strong>: Valid email address (unique)</li>
                                <li><strong>role</strong>: admin, manager, or developer</li>
                                <li><strong>password</strong>: Initial password (min 6 chars)</li>
                            </ul>
                        ) : (
                            <ul>
                                <li><strong>title</strong>: Task title</li>
                                <li><strong>description</strong>: Task description (optional)</li>
                                <li><strong>priority</strong>: low, medium, or high</li>
                                <li><strong>status</strong>: open, in-progress, review, or completed</li>
                                <li><strong>projectId</strong>: Valid project ID</li>
                                <li><strong>assigneeEmail</strong>: Email of assigned user (optional)</li>
                            </ul>
                        )}
                    </Card.Body>
                </Card>
            </Container>
        </AdminLayout>
    );
}
