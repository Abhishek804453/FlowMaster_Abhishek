// routes.js
const express = require('express');
const router = express.Router();
const workflowEngine = require('./workflowEngine');

// Start a new workflow
router.post('/', async (req, res) => {
    try {
        const workflowId = await workflowEngine.startWorkflow();
        res.status(201).json({ workflowId, status: 'started' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to start workflow', details: err.message });
    }
});

// Check workflow status
router.get('/:id', async (req, res) => {
    const { pool } = require('./db');
    const workflowId = req.params.id;

    try {
        const result = await pool.query(
            'SELECT step, status, created_at FROM workflow_log WHERE workflow_id=$1 ORDER BY created_at',
            [workflowId]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Workflow not found' });

        let overall = 'success';
        for (let r of result.rows) {
            if (r.status === 'failure') overall = 'failure';
            if (r.status === 'pending' && overall !== 'failure') overall = 'pending';
        }

        res.json({ workflowId, status: overall, steps: result.rows });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;