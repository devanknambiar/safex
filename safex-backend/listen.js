require('dotenv').config();
const mqtt = require('mqtt');
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const MQTT_BROKER_URL = process.env.URL;

const MQTT_OPTIONS = {
  port: process.env.PORT,
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
app.use(cors());
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

  // --- THIS IS THE RESTORED MESSAGE HANDLER ---
  mqttClient.on('message', async (topic, message) => {
    try {
      const messageJson = JSON.parse(message.toString());
      messageJson.receivedAt = new Date();
      
      const collection = db.collection(SENSOR_COLLECTION);
      const result = await collection.insertOne(messageJson);
      
      // The detailed log message has been restored.
      console.log(`📄 Message inserted into MongoDB with _id: ${result.insertedId}`);

    } catch (err) {
      console.error('❌ Error processing message:', err);
    }
  });


  // --- SIGNUP API ENDPOINT ---
  app.post('/api/signup', async (req, res) => {
    try {
      const { fullName, email, password } = req.body;
      const usersCollection = db.collection(USER_COLLECTION);

      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        fullName,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);
      res.status(201).json({ message: 'User created successfully!', userId: result.insertedId });

    } catch (err) { // <-- The missing '{' is added here
      console.error("Signup API Error:", err);
      res.status(500).json({ error: 'Failed to create user.' });
    }
  });


  // --- LOGIN API ENDPOINT ---
  app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Corrected the typo from USER_COLlection to USER_COLLECTION
        const usersCollection = db.collection(USER_COLLECTION);

        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        
        res.status(200).json({
            message: 'Login successful!',
            user: {
                email: user.email,
                name: user.fullName,
                id: user._id
            }
        });

    } catch (err) {
        console.error("Login API Error:", err);
        res.status(500).json({ error: 'Failed to log in.' });
    }
  });


  // --- GET LATEST DATA ENDPOINT ---
  app.get('/api/latest-data', async (req, res) => {
    try {
      const collection = db.collection(SENSOR_COLLECTION);
      const latestData = await collection.findOne({}, { sort: { receivedAt: -1 } });
      if (latestData) {
        res.json(latestData);
      } else {
        res.status(404).json({ error: 'No data found' });
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  });

  app.listen(API_PORT, () => {
    console.log(`\n🚀 API server running at http://localhost:${API_PORT}`);
  });
}

main().catch(console.error);

