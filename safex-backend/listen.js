require('dotenv').config();
const mqtt = require('mqtt');
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const MQTT_BROKER_URL = process.env.URL;
const MQTT_OPTIONS = {
  port: parseInt(process.env.PORT),
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
  protocol: 'mqtts',
};

const MONGO_URI = process.env.MONGODB;
const DB_NAME = 'wearableDataDB';
const SENSOR_COLLECTION = 'sensorReadings';
const USER_COLLECTION = 'users';
const API_PORT = 3001;

let db;
const app = express();

// --- MIDDLEWARE ---
app.use(cors()); // Allows Frontend to talk to Backend
app.use(express.json());

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
    console.log('✅ Connected to MQTT!'); 
    mqttClient.subscribe('wearable/device-01/data'); 
  });

  mqttClient.on('message', async (topic, message) => {
    try {
      const messageJson = JSON.parse(message.toString());
      // Ensure we save a standard ISO date string
      messageJson.receivedAt = new Date().toISOString(); 
      
      const collection = db.collection(SENSOR_COLLECTION);
      const result = await collection.insertOne(messageJson);
      console.log(`📄 Data stored: ID ${result.insertedId}`);
    } catch (err) {
      console.error('❌ Error processing MQTT message:', err);
    }
  });

  // --- API ENDPOINTS ---

  app.post('/api/signup', async (req, res) => {
    try {
      const { fullName, email, password } = req.body;
      const usersCollection = db.collection(USER_COLLECTION);
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) return res.status(400).json({ error: 'User exists' });

      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await usersCollection.insertOne({
        fullName, email, password: hashedPassword, createdAt: new Date()
      });
      res.status(201).json({ message: 'User created', userId: result.insertedId });
    } catch (err) {
      res.status(500).json({ error: 'Signup failed' });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await db.collection(USER_COLLECTION).findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.json({ message: 'Login successful', user: { email: user.email, name: user.fullName, id: user._id } });
    } catch (err) {
      res.status(500).json({ error: 'Login error' });
    }
  });

  app.get('/api/latest-data', async (req, res) => {
    try {
      const collection = db.collection(SENSOR_COLLECTION);
      // Sort by _id descending to get the absolute newest entry
      const latestData = await collection.findOne({}, { sort: { _id: -1 } });
      if (latestData) {
        res.json(latestData);
      } else {
        res.status(404).json({ error: 'No data found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Fetch error' });
    }
  });

  app.listen(API_PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${API_PORT}`);
  });
}
// working
main().catch(console.error);