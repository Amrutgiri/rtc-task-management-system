const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET /health - System health check
router.get('/', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1;
        const memoryUsage = process.memoryUsage();

        const memUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const memTotalMB = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
        const memPercentage = ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

        res.json({
            status: dbStatus ? 'healthy' : 'degraded',
            database: dbStatus ? 'connected' : 'disconnected',
            memory: {
                used: `${memUsedMB} MB`,
                total: `${memTotalMB} MB`,
                percentage: memPercentage
            },
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
