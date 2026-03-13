const express = require('express');
const routes = require('./routes');
const { connectKafka } = require('./kafka');

const app = express();
app.use(express.json());
app.use('/workflows', routes);

async function start() {
    try {
        await connectKafka();
        app.listen(3000, () => console.log('Orchestrator running on port 3000'));
    } catch (err) {
        console.error('Failed to start orchestrator:', err);
    }
}

start();