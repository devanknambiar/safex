require('dotenv').config();

const mqtt = require('mqtt');

const BROKER_URL = process.env.URL; 
const PORT = process.env.PORT; 
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;

const TOPIC_TO_SUBSCRIBE = 'wearable/device-01/data';


const options = {
  port: PORT,
  username: USERNAME,
  password: PASSWORD,
  protocol: 'mqtts', 
};

console.log(`Attempting to connect to MQTT broker at ${BROKER_URL}...`);

const client = mqtt.connect(BROKER_URL, options);

client.on('connect', () => {
  console.log('✅ Successfully connected to MQTT broker!');
  
  client.subscribe(TOPIC_TO_SUBSCRIBE, (err) => {
    if (!err) {
      console.log(`👂 Subscribed to topic: "${TOPIC_TO_SUBSCRIBE}"`);
      console.log('---');
      console.log('Waiting for messages...');
    } else {
      console.error('❌ Subscription failed:', err);
    }
  });
});

client.on('message', (topic, message) => {
  const messageString = message.toString();
  console.log(`\n📬 Message received on topic: ${topic}`);
  
  try {
    const messageJson = JSON.parse(messageString);
    console.log('Payload (JSON):');
    console.dir(messageJson, { depth: null });
  } catch (e) {
    console.log('Payload (Raw):', messageString);
  }
  console.log('---');
});

client.on('error', (err) => {
  console.error('❌ Connection error:', err);
  client.end();
});

client.on('close', () => {
  console.log('🔌 Connection closed.');
});