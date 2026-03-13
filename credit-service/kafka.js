const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "credit",
    brokers: ["localhost:9092"]
});

const consumer = kafka.consumer({ groupId: "credit-group" });
const producer = kafka.producer();

module.exports = { consumer, producer };