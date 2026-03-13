const { Kafka } = require('kafkajs');

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'orchestrator-group' });

const connectKafka = async () => {
    await producer.connect();
    await consumer.connect();
    console.log("Kafka producer & consumer connected");
};

module.exports = { kafka, producer, consumer, connectKafka };