const { consumer, producer } = require('./kafka');
const { pool } = require('./db');
const workflowEngine = require('./workflowEngine');


const recoverWorkflows = async () => {
    const res = await pool.query("SELECT DISTINCT id FROM workflow_log WHERE status='pending'");
    for (let row of res.rows) {
        const workflowId = row.id;
        await workflowEngine.resumeWorkflow(workflowId);
        console.log(`Recovered workflow ${workflowId}`);
    }
};

const startConsumer = async () => {
    await recoverWorkflows();

    await consumer.subscribe({ topic: 'verification_result', fromBeginning: true });
    await consumer.subscribe({ topic: 'credit_result', fromBeginning: true });

    await consumer.run({
        eachMessage: async ({ topic, message }) => {
            const data = JSON.parse(message.value.toString());
            const workflowId = data.workflowId;

            await pool.query('INSERT INTO workflow_log(id, step, status) VALUES($1,$2,$3)', [workflowId, topic, data.status]);

            await workflowEngine.handleEvent(topic, workflowId, data.status);
        }
    });
};

module.exports = startConsumer;