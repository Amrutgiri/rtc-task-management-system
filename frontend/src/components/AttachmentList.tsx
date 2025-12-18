import { useState, useEffect } from 'react';
import { Download, Trash2, Eye, FileText, Clock } from 'lucide-react';
import { Spinner, Badge } from 'react-bootstrap';
import Swal from 'sweetalert2';
import type { Attachment } from '../api/attachments';
import {
    formatFileSize,
    getFileIcon,
    canPreviewFile,
    triggerTaskAttachmentDownload,
    triggerProjectAttachmentDownload,
    deleteTaskAttachment,
    deleteProjectAttachment,
    listTaskAttachments,
    listProjectAttachments,
} from '../api/attachments';

interface AttachmentListProps {
    entityId: string;
    entityType: 'task' | 'project';
    onAttachmentDeleted?: () => void;
}

export default function AttachmentList({
    entityId,
    entityType,
    onAttachmentDeleted,
}: AttachmentListProps) {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Load attachments
    useEffect(() => {
        loadAttachments();
    }, [entityId, entityType]);

    const loadAttachments = async () => {
        try {
            setLoading(true);
            setError('');

            const listFn = entityType === 'task' ? listTaskAttachments : listProjectAttachments;
            const data = await listFn(entityId);

            setAttachments(data);
        } catch (err: any) {
            console.error('Failed to load attachments:', err);
            setError(err.response?.data?.message || 'Failed to load attachments');
        } finally {
            setLoading(false);
        }
    };

    // Download attachment
    const handleDownload = async (attachment: Attachment) => {
        try {
            const downloadFn = entityType === 'task'
                ? triggerTaskAttachmentDownload
                : triggerProjectAttachmentDownload;

            await downloadFn(entityId, attachment._id, attachment.filename);

            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Download started',
                showConfirmButton: false,
                timer: 2000,
            });
        } catch (err: any) {
            console.error('Download error:', err);
            Swal.fire('Error', 'Failed to download file', 'error');
        }
    };

    // Delete attachment
    const handleDelete = async (attachment: Attachment) => {
        const result = await Swal.fire({
            title: 'Delete Attachment?',
            text: `Are you sure you want to delete "${attachment.filename}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it',
        });

        if (!result.isConfirmed) return;

        try {
            const deleteFn = entityType === 'task'
                ? deleteTaskAttachment
                : deleteProjectAttachment;

            const response = await deleteFn(entityId, attachment._id);

            setAttachments(response.attachments);

            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Attachment deleted',
                showConfirmButton: false,
                timer: 2000,
            });

            if (onAttachmentDeleted) {
                onAttachmentDeleted();
            }
        } catch (err: any) {
            console.error('Delete error:', err);
            Swal.fire(
                'Error',
                err.response?.data?.message || 'Failed to delete attachment',
                'error'
            );
        }
    };

    // Format date
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    // Loading state
    if (loading) {
        return (
            <div className="text-center py-4">
                <Spinner animation="border" variant="primary" />
                <p className="text-muted mt-2">Loading attachments...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="alert alert-danger">
                <strong>Error:</strong> {error}
            </div>
        );
    }

    // Empty state
    if (attachments.length === 0) {
        return (
            <div className="empty-state text-center py-5">
                <FileText size={48} className="text-muted mb-3" />
                <h6>No Attachments Yet</h6>
                <p className="text-muted">Upload files to share with your team</p>
            </div>
        );
    }

    // Render attachments list
    return (
        <div className="attachment-list">
            <div className="attachment-header mb-3">
                <h6>Attachments ({attachments.length})</h6>
            </div>

            <div className="attachment-items">
                {attachments.map((attachment) => (
                    <div key={attachment._id} className="attachment-item">
                        {/* File Icon */}
                        <div className="attachment-icon">
                            <i className={`bi ${getFileIcon(attachment.mimetype)}`} style={{ fontSize: '2rem' }} />
                        </div>

                        {/* File Info */}
                        <div className="attachment-info flex-grow-1">
                            <div className="attachment-name">{attachment.filename}</div>

                            <div className="attachment-meta text-muted">
                                <span className="me-3">
                                    {formatFileSize(attachment.size)}
                                </span>
                                <span className="me-3">
                                    <Clock size={14} className="me-1" />
                                    {formatDate(attachment.uploadedAt)}
                                </span>
                                <span>
                                    by {attachment.uploadedBy.name}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="attachment-actions">
                            {canPreviewFile(attachment.mimetype) && (
                                <button
                                    className="btn btn-sm btn-outline-secondary me-2"
                                    onClick={() => handleDownload(attachment)}
                                    title="Preview"
                                >
                                    <Eye size={16} />
                                </button>
                            )}

                            <button
                                className="btn btn-sm btn-outline-primary me-2"
                                onClick={() => handleDownload(attachment)}
                                title="Download"
                            >
                                <Download size={16} />
                            </button>

                            <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(attachment)}
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
