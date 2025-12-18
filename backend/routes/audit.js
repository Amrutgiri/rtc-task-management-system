const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { authMiddleware } = require('../middleware/auth');

// GET /audit - Get audit logs with pagination and filters
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        // Only admins can view audit logs
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Unauthorized. Admin access required.' });
        }

        const {
            page = 1,
            pageSize = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            userId,
            action,
            entityType,
            startDate,
            endDate
        } = req.query;

        const query = {};

        if (userId) query.userId = userId;
        if (action) query.action = action;
        if (entityType) query.entityType = entityType;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const totalCount = await AuditLog.countDocuments(query);
        const skip = (parseInt(page) - 1) * parseInt(pageSize);

        const logs = await AuditLog.find(query)
            .populate('userId', 'name email')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(pageSize))
            .lean();

        res.json({
            data: logs,
            totalCount,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(totalCount / parseInt(pageSize))
        });
    } catch (err) {
        next(err);
    }
});

// Helper function to create audit log
async function createAuditLog(userId, action, entityType, entityId = null, details = {}, req = null) {
    try {
        await AuditLog.create({
            userId,
            action,
            entityType,
            entityId,
            details,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.get('user-agent')
        });
    } catch (err) {
        console.error('Failed to create audit log:', err);
    }
}

// Export helper
router.createAuditLog = createAuditLog;

module.exports = router;
