const express = require('express');
const { consumer, producer } = require('./kafka');

const app = express();
const PORT = 3001;

consumer.subscribe({ topic: 'start_verification', fromBeginning: true });

consumer.run({
    eachMessage: async ({ topic, message }) => {
        const { workflowId } = JSON.parse(message.value.toString());
        console.log(`Verification service received workflow: ${workflowId}`);

        const status = Math.random() > 0.2 ? 'success' : 'failure';
        await new Promise(r => setTimeout(r, 500));

        await producer.send({
            topic: 'verification_result',
            messages: [{ key: workflowId, value: JSON.stringify({ workflowId, status }) }]
        });

        if (topic === 'compensate_verification') {
            console.log(`Compensation triggered for workflow ${workflowId}`);
        }
    }
});

app.listen(PORT, () => console.log(`Verification service running on ${PORT}`));