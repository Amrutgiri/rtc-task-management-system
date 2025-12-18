import { useState, useCallback } from 'react';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { Alert } from 'react-bootstrap';

interface FileUploadProps {
    entityId: string;
    entityType: 'task' | 'project';
    onUploadComplete: () => void;
    maxFiles?: number;
    maxSizeMB?: number;
}

interface FileWithPreview {
    file: File;
    preview?: string;
    id: string;
}

export default function FileUpload({
    entityId,
    entityType,
    onUploadComplete,
    maxFiles = 5,
    maxSizeMB = 10,
}: FileUploadProps) {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string>('');
    const [uploadProgress, setUploadProgress] = useState(0);

    // Handle drag events
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    // Handle drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    }, []);

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    // Process selected files
    const handleFiles = (selectedFiles: File[]) => {
        setError('');

        // Check max files
        if (files.length + selectedFiles.length > maxFiles) {
            setError(`Maximum ${maxFiles} files allowed`);
            return;
        }

        // Check file sizes and create previews
        const validFiles: FileWithPreview[] = [];
        const maxSizeBytes = maxSizeMB * 1024 * 1024;

        selectedFiles.forEach((file) => {
            if (file.size > maxSizeBytes) {
                setError(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
                return;
            }

            const fileWithPreview: FileWithPreview = {
                file,
                id: `${Date.now()}-${file.name}`,
            };

            // Create preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    fileWithPreview.preview = reader.result as string;
                    setFiles(prev => [...prev]);
                };
                reader.readAsDataURL(file);
            }

            validFiles.push(fileWithPreview);
        });

        setFiles(prev => [...prev, ...validFiles]);
    };

    // Remove file from list
    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
        setError('');
    };

    // Upload files
    const handleUpload = async () => {
        if (files.length === 0) {
            setError('Please select files to upload');
            return;
        }

        setUploading(true);
        setError('');
        setUploadProgress(0);

        try {
            const { uploadTaskAttachments, uploadProjectAttachments } = await import('../api/attachments');

            const uploadFn = entityType === 'task' ? uploadTaskAttachments : uploadProjectAttachments;

            // Simulate progress (real progress would need backend support)
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            await uploadFn(entityId, files.map(f => f.file));

            clearInterval(progressInterval);
            setUploadProgress(100);

            // Success
            setFiles([]);
            onUploadComplete();

            setTimeout(() => {
                setUploadProgress(0);
            }, 1000);

        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || 'Failed to upload files');
        } finally {
            setUploading(false);
        }
    };

    // Format file size
    const formatSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="file-upload-container">
            {/* Drag and Drop Zone */}
            <div
                className={`dropzone ${dragActive ? 'active' : ''} ${uploading ? 'disabled' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    disabled={uploading}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                    style={{ display: 'none' }}
                    id={`file-input-${entityId}`}
                />

                <label htmlFor={`file-input-${entityId}`} className="dropzone-label">
                    <Upload size={48} className="upload-icon" />
                    <p className="dropzone-text">
                        <strong>Drag files here</strong> or click to browse
                    </p>
                    <p className="dropzone-subtext">
                        Max {maxFiles} files, {maxSizeMB}MB each
                    </p>
                    <p className="dropzone-subtext text-muted">
                        Supported: Images, PDFs, Docs, Excel, Text, ZIP
                    </p>
                </label>
            </div>

            {/* Error Message */}
            {error && (
                <Alert variant="danger" className="mt-3" onClose={() => setError('')} dismissible>
                    <AlertCircle size={16} className="me-2" />
                    {error}
                </Alert>
            )}

            {/* File Preview List */}
            {files.length > 0 && (
                <div className="file-list mt-3">
                    <h6>Selected Files ({files.length}/{maxFiles})</h6>

                    <div className="file-items">
                        {files.map((fileItem) => (
                            <div key={fileItem.id} className="file-item">
                                {fileItem.preview ? (
                                    <img src={fileItem.preview} alt="" className="file-preview" />
                                ) : (
                                    <File size={32} className="file-icon" />
                                )}

                                <div className="file-info">
                                    <div className="file-name">{fileItem.file.name}</div>
                                    <div className="file-size text-muted">{formatSize(fileItem.file.size)}</div>
                                </div>

                                {!uploading && (
                                    <button
                                        className="btn btn-sm btn-link text-danger"
                                        onClick={() => removeFile(fileItem.id)}
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Upload Button */}
                    <button
                        className="btn btn-primary mt-3"
                        onClick={handleUpload}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Uploading... {uploadProgress}%
                            </>
                        ) : (
                            <>
                                <Upload size={16} className="me-2" />
                                Upload {files.length} File{files.length !== 1 ? 's' : ''}
                            </>
                        )}
                    </button>

                    {/* Progress Bar */}
                    {uploading && uploadProgress > 0 && (
                        <div className="progress mt-2">
                            <div
                                className="progress-bar progress-bar-striped progress-bar-animated"
                                style={{ width: `${uploadProgress}%` }}
                            >
                                {uploadProgress}%
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
