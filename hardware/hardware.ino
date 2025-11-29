#include "DHT.h"
#include <Wire.h> 
#include "MAX30105.h"

// OLED
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// WiFi / MQTT
#include <WiFi.h>
#include <WiFiClientSecure.h> 
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <time.h>

// Algorithms
#include "heartRate.h"
#include "spo2_algorithm.h"

// 👉 NEW: Your external config
#include "config.h"

// 0. PIN CONFIGURATION
#define OLED_SDA_PIN 18
#define OLED_SCL_PIN 19

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Sensors
#define MQ6_PIN   34
#define MQ135_PIN 35
#define MQ7_PIN   32
#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// MQTT
WiFiClientSecure espClient;
PubSubClient client(espClient);

// MAX30105
MAX30105 particleSensor;
const int bufferLength = 100;
uint32_t irBuffer[bufferLength];
uint32_t redBuffer[bufferLength];
byte sampleCount = 0;

int32_t spo2 = 0;
int8_t validSPO2 = 0;
int32_t heartRate = 0;
int8_t validHeartRate = 0;

unsigned long lastMsg = 0;


void setup() {
  Serial.begin(115200);
  Serial.println("\n--- System Boot ---");

  Wire.begin(OLED_SDA_PIN, OLED_SCL_PIN);

  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("OLED ERROR");
    for(;;);
  }

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Booting...");
  display.display();

  // MAX30105
  if (!particleSensor.begin(Wire)) {
    Serial.println("MAX30105 ERROR");
    while (1);
  }

  particleSensor.setup();

  dht.begin();
  pinMode(MQ6_PIN, INPUT);
  pinMode(MQ135_PIN, INPUT);
  pinMode(MQ7_PIN, INPUT);

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi connected.");

  // NTP
  configTime(0, 0, "pool.ntp.org");
  time_t now = time(nullptr);
  while (now < 1000000000) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
  }
  Serial.println("\nTime OK");

  // SSL
  espClient.setCACert(ROOT_CA_CERT);

  // MQTT
  client.setServer(MQTT_SERVER, MQTT_PORT);

  Serial.println("Setup complete.");
}


// MQTT reconnect
void reconnect() {
  while (!client.connected()) {
    Serial.print("Trying MQTT... ");

    String clientId = "ESP-";
    clientId += random(0xffff);

    if (client.connect(clientId.c_str(), MQTT_USER, MQTT_PASS)) {
      Serial.println("Connected");
    } else {
      Serial.print("Failed: ");
      Serial.println(client.state());
      delay(2000);
    }
  }
}


// Display function
void displayData(float t, float h, int hr, int spo2, bool mqtt_status) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);

  display.print("MQTT: ");
  display.println(mqtt_status ? "OK" : "FAIL");

  display.setTextSize(2);
  display.setCursor(0, 12);
  display.print("HR:");
  display.print(hr);

  display.setCursor(0, 32);
  display.print("O2:");
  display.print(spo2);

  display.setTextSize(1);
  display.setCursor(0, 54);
  display.print("T:");
  display.print(t);

  display.setCursor(64, 54);
  display.print("H:");
  display.print(h);

  display.display();
}


// Publish JSON
void publishData(float t, float h, float mq6, float mq135, float mq7, int hr, int spo2) {
  StaticJsonDocument<256> doc;
  doc["device_id"] = "device-01";
  doc["timestamp_ms"] = millis();
  doc["temperature_C"] = t;
  doc["humidity_percent"] = h;
  doc["mq6_volt"] = mq6;
  doc["mq135_volt"] = mq135;
  doc["mq7_volt"] = mq7;
  doc["heart_rate_bpm"] = hr;
  doc["spo2_percent"] = spo2;

  char buffer[256];
  serializeJson(doc, buffer);
  client.publish(MQTT_TOPIC, buffer);

  Serial.print("Published: ");
  Serial.println(buffer);
}


// MAIN LOOP
void loop() {

  if (!client.connected()) reconnect();
  client.loop();

  // MAX30105
  if (sampleCount < bufferLength) {
    irBuffer[sampleCount] = particleSensor.getIR();
    redBuffer[sampleCount] = particleSensor.getRed();
    sampleCount++;
  }

  if (sampleCount == bufferLength) {
    maxim_heart_rate_and_oxygen_saturation(
      irBuffer, bufferLength, redBuffer,
      &spo2, &validSPO2, &heartRate, &validHeartRate
    );

    for (byte i = 25; i < bufferLength; i++) {
        redBuffer[i - 25] = redBuffer[i];
        irBuffer[i - 25] = irBuffer[i];
    }
    sampleCount = 75;
  }

  // Other sensors
  float mq6 = analogRead(MQ6_PIN) * (3.3 / 4095.0);
  float mq135 = analogRead(MQ135_PIN) * (3.3 / 4095.0);
  float mq7 = analogRead(MQ7_PIN) * (3.3 / 4095.0);
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  unsigned long now = millis();
  if (now - lastMsg > 10000) {
    lastMsg = now;

    publishData(
      t, h,
      mq6, mq135, mq7,
      validHeartRate ? heartRate : 0,
      validSPO2 ? spo2 : 0
    );
  }

  displayData(
    t, h,
    validHeartRate ? heartRate : 0,
    validSPO2 ? spo2 : 0,
    client.connected()
  );
}
