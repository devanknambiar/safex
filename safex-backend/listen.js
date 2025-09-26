require('dotenv').config();
const mqtt = require('mqtt');
const express = require('express');
const { MongoClient } = require('mongodb');

const MQTT_BROKER_URL = process.env.URL;
const MQTT_OPTIONS = {
  port: process.env.PORT,
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  protocol: 'mqtts',
};
const MQTT_TOPIC = 'wearable/device-01/data';

const MONGO_URI = process.env.MONGODB;
const DB_NAME = 'wearableDataDB';
const COLLECTION_NAME = 'sensorReadings';

const API_PORT = 3001;

let db;
const app = express();

async function main() {
  try {
    const mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    console.log(`✅ Successfully connected to MongoDB: ${DB_NAME}`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }

  const mqttClient = mqtt.connect(MQTT_BROKER_URL, MQTT_OPTIONS);

  mqttClient.on('connect', () => {
    console.log('✅ Successfully connected to MQTT broker!');
    mqttClient.subscribe(MQTT_TOPIC, (err) => {
      if (!err) {
        console.log(`👂 Subscribed to topic: "${MQTT_TOPIC}"`);
      } else {
        console.error('❌ MQTT subscription failed:', err);
      }
    });
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      const messageJson = JSON.parse(message.toString());
      console.log(`\n📬 Message received on topic: ${topic}`);
      
      messageJson.receivedAt = new Date();

      const collection = db.collection(COLLECTION_NAME);
      const result = await collection.insertOne(messageJson);
      
      console.log(`📄 Message inserted into MongoDB with _id: ${result.insertedId}`);

    } catch (err) {
      console.error('❌ Error processing message:', err);
    }
  });

  mqttClient.on('error', (err) => console.error('❌ MQTT Connection error:', err));
  mqttClient.on('close', () => console.log('🔌 MQTT Connection closed.'));

  app.get('/api/latest-data', async (req, res) => {
    try {
      const collection = db.collection(COLLECTION_NAME);
      const latestData = await collection.findOne({}, { sort: { receivedAt: -1 } });
      
      if (latestData) {
        res.json(latestData);
      } else {
        res.status(404).json({ error: 'No data found' });
      }
    } catch (err) {
      console.error("API Error:", err);
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });

  app.listen(API_PORT, () => {
    console.log(`\n🚀 API server running at http://localhost:${API_PORT}`);
  });
}

main().catch(console.error);