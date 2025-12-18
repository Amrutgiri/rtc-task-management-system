const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');

// Configure multer for file upload
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

// Import Users from CSV
router.post('/users', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let imported = 0;
    let rowNumber = 1; // Start from 1 (header is row 0)

    try {
        // Parse CSV file
        const stream = fs.createReadStream(req.file.path)
            .pipe(csv());

        for await (const row of stream) {
            rowNumber++;

            try {
                // Validate required fields
                if (!row.name || !row.email || !row.role || !row.password) {
                    errors.push({
                        row: rowNumber,
                        error: 'Missing required fields (name, email, role, password)'
                    });
                    continue;
                }

                // Validate role
                const validRoles = ['admin', 'manager', 'developer'];
                if (!validRoles.includes(row.role.toLowerCase())) {
                    errors.push({
                        row: rowNumber,
                        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
                    });
                    continue;
                }

                // Validate password length
                if (row.password.length < 6) {
                    errors.push({
                        row: rowNumber,
                        error: 'Password must be at least 6 characters'
                    });
                    continue;
                }

                // Check for duplicate email
                const existingUser = await User.findOne({ email: row.email.toLowerCase() });
                if (existingUser) {
                    errors.push({
                        row: rowNumber,
                        error: `Email already exists: ${row.email}`
                    });
                    continue;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(row.password, 10);

                // Create user
                const user = new User({
                    name: row.name.trim(),
                    email: row.email.toLowerCase().trim(),
                    password: hashedPassword,
                    role: row.role.toLowerCase().trim()
                });

                await user.save();
                imported++;
                results.push({ row: rowNumber, email: row.email, status: 'success' });

            } catch (error) {
                errors.push({
                    row: rowNumber,
                    error: error.message || 'Failed to import user'
                });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            message: `Import completed. ${imported} users imported successfully${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
            imported,
            total: rowNumber - 1, // Exclude header
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Import failed', error: error.message });
    }
});

// Import Tasks from CSV
router.post('/tasks', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const errors = [];
    let imported = 0;
    let rowNumber = 1;

    try {
        const stream = fs.createReadStream(req.file.path)
            .pipe(csv());

        for await (const row of stream) {
            rowNumber++;

            try {
                // Validate required fields
                if (!row.title || !row.priority || !row.status || !row.projectId) {
                    errors.push({
                        row: rowNumber,
                        error: 'Missing required fields (title, priority, status, projectId)'
                    });
                    continue;
                }

                // Validate priority
                const validPriorities = ['low', 'medium', 'high'];
                if (!validPriorities.includes(row.priority.toLowerCase())) {
                    errors.push({
                        row: rowNumber,
                        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
                    });
                    continue;
                }

                // Validate status
                const validStatuses = ['open', 'in-progress', 'review', 'completed'];
                if (!validStatuses.includes(row.status.toLowerCase())) {
                    errors.push({
                        row: rowNumber,
                        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
                    });
                    continue;
                }

                // Validate project exists
                const project = await Project.findById(row.projectId.trim());
                if (!project) {
                    errors.push({
                        row: rowNumber,
                        error: `Project not found: ${row.projectId}`
                    });
                    continue;
                }

                // Find assignee by email (optional)
                let assigneeId = null;
                if (row.assigneeEmail && row.assigneeEmail.trim()) {
                    const assignee = await User.findOne({ email: row.assigneeEmail.toLowerCase().trim() });
                    if (!assignee) {
                        errors.push({
                            row: rowNumber,
                            error: `Assignee not found: ${row.assigneeEmail}`
                        });
                        continue;
                    }
                    assigneeId = assignee._id;
                }

                // Create task
                const task = new Task({
                    title: row.title.trim(),
                    description: row.description ? row.description.trim() : '',
                    priority: row.priority.toLowerCase().trim(),
                    status: row.status.toLowerCase().trim(),
                    projectId: row.projectId.trim(),
                    assigneeId: assigneeId,
                    taskDate: row.taskDate || new Date(),
                    createdBy: req.user._id
                });

                await task.save();
                imported++;
                results.push({ row: rowNumber, title: row.title, status: 'success' });

            } catch (error) {
                errors.push({
                    row: rowNumber,
                    error: error.message || 'Failed to import task'
                });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            message: `Import completed. ${imported} tasks imported successfully${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
            imported,
            total: rowNumber - 1,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: 'Import failed', error: error.message });
    }
});

module.exports = router;
