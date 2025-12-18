const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Local filesystem storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine entity type and ID from route
    let entityType = 'general';
    let entityId = 'temp';

    // Check if this is a task or project upload
    if (req.baseUrl && req.baseUrl.includes('/tasks')) {
      entityType = 'tasks';
      entityId = req.params.id || 'temp';
    } else if (req.baseUrl && req.baseUrl.includes('/projects')) {
      entityType = 'projects';
      entityId = req.params.id || 'temp';
    }

    // Create directory structure: uploads/{entityType}/{entityId}/
    const uploadDir = path.join('uploads', entityType, entityId);

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true });

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    // Sanitize filename: remove special characters, keep extension
    const timestamp = Date.now();
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);

    // Replace spaces and special chars with underscore
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');

    // Final filename: timestamp-sanitizedname.ext
    const filename = `${timestamp}-${sanitized}${ext}`;

    cb(null, filename);
  }
});

// File filter - only allow specific file types
const fileFilter = (req, file, cb) => {
  // Allowed MIME types
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',

    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

    // Spreadsheets
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/csv',

    // Presentations
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

    // Text files
    'text/plain',

    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: images, PDFs, docs, spreadsheets, text files, and ZIP archives.`), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files at once
  }
});

module.exports = upload;
