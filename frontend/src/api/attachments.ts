import api from "./axios";

// ==================== TYPES ====================

export interface Attachment {
    _id: string;
    filename: string;
    path: string;
    url?: string;
    mimetype: string;
    size: number;
    uploadedBy: {
        _id: string;
        name: string;
        email: string;
    };
    uploadedAt: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface UploadResponse {
    message: string;
    attachments: Attachment[];
}

// ==================== TASK ATTACHMENTS ====================

/**
 * Upload files to a task
 * @param taskId - Task ID
 * @param files - Array of File objects
 * @returns Promise with upload response
 */
export const uploadTaskAttachments = async (
    taskId: string,
    files: File[]
): Promise<UploadResponse> => {
    const formData = new FormData();

    // Append all files to form data
    files.forEach((file) => {
        formData.append('files', file);
    });

    const response = await api.post(
        `/tasks/${taskId}/attachments/upload`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response.data;
};

/**
 * List all attachments for a task
 * @param taskId - Task ID
 * @returns Promise with array of attachments
 */
export const listTaskAttachments = async (
    taskId: string
): Promise<Attachment[]> => {
    const response = await api.get(`/tasks/${taskId}/attachments`);
    return response.data;
};

/**
 * Download a task attachment
 * @param taskId - Task ID
 * @param attachmentId - Attachment ID
 * @returns Download URL
 */
export const downloadTaskAttachment = (
    taskId: string,
    attachmentId: string
): string => {
    // Return the download URL - browser will handle download
    const baseURL = api.defaults.baseURL || '';
    const token = localStorage.getItem('token');
    return `${baseURL}/tasks/${taskId}/attachments/${attachmentId}/download?token=${token}`;
};

/**
 * Trigger file download in browser
 * @param taskId - Task ID
 * @param attachmentId - Attachment ID
 * @param filename - Original filename
 */
export const triggerTaskAttachmentDownload = async (
    taskId: string,
    attachmentId: string,
    filename: string
): Promise<void> => {
    const response = await api.get(
        `/tasks/${taskId}/attachments/${attachmentId}/download`,
        {
            responseType: 'blob',
        }
    );

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * Delete a task attachment
 * @param taskId - Task ID
 * @param attachmentId - Attachment ID
 * @returns Promise with updated attachments list
 */
export const deleteTaskAttachment = async (
    taskId: string,
    attachmentId: string
): Promise<{ message: string; attachments: Attachment[] }> => {
    const response = await api.delete(
        `/tasks/${taskId}/attachments/${attachmentId}`
    );
    return response.data;
};

// ==================== PROJECT ATTACHMENTS ====================

/**
 * Upload files to a project
 * @param projectId - Project ID
 * @param files - Array of File objects
 * @returns Promise with upload response
 */
export const uploadProjectAttachments = async (
    projectId: string,
    files: File[]
): Promise<UploadResponse> => {
    const formData = new FormData();

    files.forEach((file) => {
        formData.append('files', file);
    });

    const response = await api.post(
        `/projects/${projectId}/attachments/upload`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return response.data;
};

/**
 * List all attachments for a project
 * @param projectId - Project ID
 * @returns Promise with array of attachments
 */
export const listProjectAttachments = async (
    projectId: string
): Promise<Attachment[]> => {
    const response = await api.get(`/projects/${projectId}/attachments`);
    return response.data;
};

/**
 * Trigger file download in browser for project attachment
 * @param projectId - Project ID
 * @param attachmentId - Attachment ID
 * @param filename - Original filename
 */
export const triggerProjectAttachmentDownload = async (
    projectId: string,
    attachmentId: string,
    filename: string
): Promise<void> => {
    const response = await api.get(
        `/projects/${projectId}/attachments/${attachmentId}/download`,
        {
            responseType: 'blob',
        }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * Delete a project attachment
 * @param projectId - Project ID
 * @param attachmentId - Attachment ID
 * @returns Promise with updated attachments list
 */
export const deleteProjectAttachment = async (
    projectId: string,
    attachmentId: string
): Promise<{ message: string; attachments: Attachment[] }> => {
    const response = await api.delete(
        `/projects/${projectId}/attachments/${attachmentId}`
    );
    return response.data;
};

// ==================== UTILITIES ====================

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file icon based on MIME type
 * @param mimetype - File MIME type
 * @returns Icon name/class
 */
export const getFileIcon = (mimetype: string): string => {
    if (mimetype.startsWith('image/')) return 'bi-file-image';
    if (mimetype === 'application/pdf') return 'bi-file-pdf';
    if (mimetype.includes('word')) return 'bi-file-word';
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'bi-file-excel';
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'bi-file-ppt';
    if (mimetype.includes('zip') || mimetype.includes('rar')) return 'bi-file-zip';
    if (mimetype.startsWith('text/')) return 'bi-file-text';

    return 'bi-file-earmark';
};

/**
 * Check if file can be previewed in browser
 * @param mimetype - File MIME type
 * @returns Boolean indicating if preview is supported
 */
export const canPreviewFile = (mimetype: string): boolean => {
    return (
        mimetype.startsWith('image/') ||
        mimetype === 'application/pdf'
    );
};
