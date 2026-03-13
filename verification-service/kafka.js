const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "verification",
    brokers: ["localhost:9092"]
});

const consumer = kafka.consumer({ groupId: "verification-group" });
const producer = kafka.producer();

module.exports = { consumer, producer };