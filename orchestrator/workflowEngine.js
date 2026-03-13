const { producer } = require('./kafka');
const workflowSteps = require('./yamlParser');
const { pool } = require('./db');

const startWorkflow = async () => {
    const workflowId = 'wf-' + Date.now();

    try {
        await pool.query(
            `INSERT INTO workflows (workflow_id, status, step, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [workflowId, 'started', workflowSteps[0].step]
        );

        await logStep(workflowId, workflowSteps[0].step, 'started');

        await producer.send({
            topic: workflowSteps[0].event,
            messages: [{ key: workflowId, value: JSON.stringify({ workflowId }) }]
        });

        return workflowId;
    } catch (err) {
        console.error('Error starting workflow:', err);
        throw err;
    }
};

const resumeWorkflow = async (workflowId) => {
    try {
        const logs = await pool.query(
            'SELECT step, status FROM workflow_log WHERE workflow_id=$1 ORDER BY created_at',
            [workflowId]
        );

        const lastSuccessIndex = logs.rows.filter(r => r.status === 'success').length;
        if (lastSuccessIndex < workflowSteps.length) {
            const nextStep = workflowSteps[lastSuccessIndex];
            await logStep(workflowId, nextStep.step, 'started');
            await producer.send({
                topic: nextStep.event,
                messages: [{ key: workflowId, value: JSON.stringify({ workflowId }) }]
            });
        }
    } catch (err) {
        console.error('Error resuming workflow:', err);
    }
};

const handleEvent = async (topic, workflowId, status) => {
    try {
        const step = workflowSteps.find(
            s => s.event === topic || s.compensation_event === topic
        );
        if (!step) return;

        await logStep(workflowId, step.step, status);

        if (status === 'success') {
            const nextStepIndex = workflowSteps.findIndex(s => s.step === step.step) + 1;
            if (nextStepIndex < workflowSteps.length) {
                const nextStep = workflowSteps[nextStepIndex];
                await logStep(workflowId, nextStep.step, 'started');
                await producer.send({
                    topic: nextStep.event,
                    messages: [{ key: workflowId, value: JSON.stringify({ workflowId }) }]
                });
            }
        } else {
            // Compensation for previous steps
            const stepsToCompensate = workflowSteps
                .slice(0, workflowSteps.findIndex(s => s.step === step.step))
                .filter(s => s.compensation_event);

            for (let s of stepsToCompensate.reverse()) {
                await logStep(workflowId, s.step, 'compensating');
                await producer.send({
                    topic: s.compensation_event,
                    messages: [{ key: workflowId, value: JSON.stringify({ workflowId }) }]
                });
            }
        }
    } catch (err) {
        console.error('Error handling event:', err);
    }
};

const logStep = async (workflowId, step, status) => {
    try {
        await pool.query(
            `INSERT INTO workflow_log (workflow_id, step, status, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [workflowId, step, status]
        );
    } catch (err) {
        console.error('Error logging workflow step:', err);
    }
};

module.exports = { startWorkflow, resumeWorkflow, handleEvent };