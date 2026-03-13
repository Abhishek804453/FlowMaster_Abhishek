// credit-service/server.js
const express = require('express');
const { consumer, producer } = require('./kafka');

const app = express();
const PORT = 3002;

consumer.subscribe({ topic: 'start_credit_check', fromBeginning: true });

consumer.run({
    eachMessage: async ({ topic, message }) => {
        const { workflowId } = JSON.parse(message.value.toString());
        console.log(`Credit service received workflow: ${workflowId}`);

        // simulate success/failure (70% success)
        const status = Math.random() > 0.3 ? 'success' : 'failure';
        await new Promise(r => setTimeout(r, 500));

        await producer.send({
            topic: 'credit_result',
            messages: [{ key: workflowId, value: JSON.stringify({ workflowId, status }) }]
        });

        // compensation if triggered
        if (topic === 'compensate_credit') {
            console.log(`Compensation triggered for workflow ${workflowId}`);
        }
    }
});

app.listen(PORT, () => console.log(`Credit service running on ${PORT}`));