require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const { SerialPort } = require('serialport');
const { DeepgramClient } = require('@deepgram/sdk');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// ============ VOICE / DEEPGRAM / USB ESP32 ============

const deepgram = new DeepgramClient({
  apiKey: process.env.DEEPGRAM_API_KEY
});

// Change COM3 to the actual COM port of your ESP32
const ESP32_PORT = 'COM3';

const esp32 = new SerialPort({
  path: ESP32_PORT,
  baudRate: 921600
});

console.log(`Opening ESP32 on ${ESP32_PORT}...`);

let deepgramConnection = null;

async function startVoiceRecognition() {

  try {

    deepgramConnection = await deepgram.listen.v1.connect({
      model: 'nova-3',
      language: 'en-IN',

      encoding: 'linear16',
      channels: 1,
      sample_rate: 16000,

      smart_format: true,
      interim_results: true,
      endpointing: 300,
      vad_events: true
    });

    deepgramConnection.on('open', () => {
      console.log('Deepgram connection opened');
      console.log('Ready to receive microphone audio');
    });

    deepgramConnection.on('message', (data) => {

      if (data.type !== 'Results') {
        return;
      }

      const transcript =
        data.channel?.alternatives?.[0]?.transcript || '';

      if (!transcript) {
        return;
      }

      console.log('VOICE:', transcript);

      // Send text to website
      io.emit('voice_transcript', {
        text: transcript,
        isFinal: data.is_final || false
      });

      // Check ACCEPT / REJECT
      const command = transcript.toLowerCase();

      if (command.includes('accept')) {

        console.log('>>> ACCEPT COMMAND');

        io.emit('voice_command', {
          command: 'ACCEPT',
          text: transcript
        });

      } else if (command.includes('reject')) {

        console.log('>>> REJECT COMMAND');

        io.emit('voice_command', {
          command: 'REJECT',
          text: transcript
        });

      }

    });

    deepgramConnection.on('error', (error) => {
      console.error('Deepgram error:', error);
    });

    deepgramConnection.on('close', () => {
      console.log('Deepgram connection closed');
    });

    deepgramConnection.connect();

    await deepgramConnection.waitForOpen();

  } catch (error) {

    console.error(
      'Failed to start Deepgram:',
      error
    );

  }
}


// ==========================================
// RECEIVE AUDIO FROM ESP32 THROUGH USB
// ==========================================

esp32.on('open', () => {

  console.log(
    `ESP32 connected through ${ESP32_PORT}`
  );

  startVoiceRecognition();

});


esp32.on('data', (data) => {

  if (!deepgramConnection) {
    return;
  }

  // Send raw PCM audio directly to Deepgram
  deepgramConnection.sendMedia(data);

});


esp32.on('error', (error) => {

  console.error(
    'ESP32 serial error:',
    error.message
  );

});


esp32.on('close', () => {

  console.log('ESP32 serial connection closed');

});

app.use(cors());
app.use(express.json());

// ============ DATABASE ============
const db = new Database(path.join(__dirname, 'mask.db'));

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT, phone TEXT, emergency_contact TEXT
)`);
db.exec(`CREATE TABLE IF NOT EXISTS aqi_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pm25 REAL, pm10 REAL, voc REAL, co2 REAL, temp REAL, humidity REAL,
  aqi INTEGER, visibility REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
db.exec(`CREATE TABLE IF NOT EXISTS sos_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'active'
)`);

const existingUser = db.prepare('SELECT id FROM users WHERE id = 1').get();
if (!existingUser) {
  db.prepare('INSERT INTO users (name, phone, emergency_contact) VALUES (?, ?, ?)')
    .run('Rohit', '+91-9876543210', '+91-9876543211');
}

// ============ MOCK GENERATORS ============
const BASE_LAT = 12.9692;
const BASE_LNG = 79.1559;

function generateAQI() {
  const pm25 = Math.round(30 + Math.random() * 270);
  const pm10 = Math.round(pm25 * 1.2 + Math.random() * 50);
  const voc = Math.round(50 + Math.random() * 450);
  const co2 = Math.round(400 + Math.random() * 600);
  const temp = Math.round((28 + Math.random() * 12) * 10) / 10;
  const humidity = Math.round(40 + Math.random() * 50);

  let aqi;
  if (pm25 <= 30) aqi = Math.round(50 * pm25 / 30);
  else if (pm25 <= 60) aqi = Math.round(50 + 50 * (pm25 - 30) / 30);
  else if (pm25 <= 90) aqi = Math.round(100 + 50 * (pm25 - 60) / 30);
  else if (pm25 <= 120) aqi = Math.round(150 + 50 * (pm25 - 90) / 30);
  else if (pm25 <= 250) aqi = Math.round(200 + 100 * (pm25 - 120) / 130);
  else aqi = Math.round(300 + 200 * (pm25 - 250) / 200);
  aqi = Math.min(aqi, 500);

  const visibility = Math.round(Math.max(3, 80 - (aqi / 500) * 77));
  return { pm25, pm10, voc, co2, temp, humidity, aqi, visibility };
}

function getAQILevel(aqi) {
  if (aqi <= 50) return { level: 'Good', color: '#00e400', bg: '#e6f9e6', advice: 'Air quality is satisfactory' };
  if (aqi <= 100) return { level: 'Satisfactory', color: '#ffff00', bg: '#fff9e6', advice: 'Acceptable quality' };
  if (aqi <= 200) return { level: 'Poor', color: '#ff7e00', bg: '#fff3e0', advice: 'High pollution - reduce exposure where possible' };
  if (aqi <= 300) return { level: 'Very Poor', color: '#ff0000', bg: '#ffe6e6', advice: 'Avoid prolonged outdoor exposure' };
  if (aqi <= 400) return { level: 'Severe', color: '#8f3f97', bg: '#f3e6ff', advice: 'Health alert: Significant health effects' };
  return { level: 'Hazardous', color: '#7e0023', bg: '#ffe6ee', advice: 'Emergency: Avoid all outdoor activity' };
}

function generateVehicles(userLat, userLng, count) {
  const vehicles = [];
  for (let i = 0; i < count; i++) {
    const distance = Math.round((10 + Math.random() * 60) * 10) / 10;
    const angle = Math.random() * Math.PI * 2;
    const spread = distance / 111000;
    vehicles.push({
      id: i + 1,
      lat: userLat + Math.cos(angle) * spread * 5,
      lng: userLng + Math.sin(angle) * spread * 5,
      type: Math.random() > 0.3 ? 'car' : Math.random() > 0.5 ? 'bike' : 'truck',
      distance
    });
  }
  return vehicles;
}

function generateRideOffers(userLat, userLng) {
  const platforms = [
    { name: 'Zomato', icon: 'Z', color: '#e23744' },
    { name: 'Swiggy', icon: 'S', color: '#fc8019' },
    { name: 'Dunzo', icon: 'D', color: '#00c853' },
  ];
  const places = [
    'Spice Garden Restaurant', 'Chai Point Cafe', 'Biryani House', 'Pizza Hub', 'Metro Store',
    'Khan Chacha', 'Behrouz Biryani', 'Wow! Momo', 'Faasos', 'Dominos'
  ];
  const sectors = ['Sector 3', 'Sector 5', 'Sector 8', 'Sector 12', 'Sector 15', 'Sector 21'];

  return Array.from({ length: 5 }, (_, i) => {
    const p = platforms[Math.floor(Math.random() * platforms.length)];
    const pickupDist = Math.round((0.3 + Math.random() * 2) * 10) / 10;
    const dropDist = Math.round((1 + Math.random() * 4) * 10) / 10;
    const earnings = Math.round(45 + Math.random() * 160);
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = Math.random() * Math.PI * 2;
    return {
      id: i + 1,
      platform: p.name, icon: p.icon, color: p.color,
      from: places[Math.floor(Math.random() * places.length)],
      to: sectors[Math.floor(Math.random() * sectors.length)],
      pickupKm: pickupDist, dropKm: dropDist,
      earnings, perKm: Math.round(earnings / (pickupDist + dropDist)),
      time: `${10 + Math.floor(Math.random() * 25)} min`,
      pickupLat: userLat + Math.cos(angle1) * (pickupDist / 111000),
      pickupLng: userLng + Math.sin(angle1) * (pickupDist / 111000),
      dropLat: userLat + Math.cos(angle2) * (dropDist / 111000),
      dropLng: userLng + Math.sin(angle2) * (dropDist / 111000),
    };
  });
}

// ============ REST API ============

app.get('/api/aqi', (req, res) => {
  const lat = parseFloat(req.query.lat) || BASE_LAT;
  const lng = parseFloat(req.query.lng) || BASE_LNG;
  const reading = generateAQI();
  const level = getAQILevel(reading.aqi);
  db.prepare('INSERT INTO aqi_readings (pm25, pm10, voc, co2, temp, humidity, aqi, visibility) VALUES (?,?,?,?,?,?,?,?)')
    .run(reading.pm25, reading.pm10, reading.voc, reading.co2, reading.temp, reading.humidity, reading.aqi, reading.visibility);
  res.json({ ...reading, ...level });
});

app.get('/api/aqi/history', (req, res) => {
  const rows = db.prepare('SELECT * FROM aqi_readings ORDER BY id DESC LIMIT 30').all();
  res.json(rows.reverse());
});

app.get('/api/vehicles', (req, res) => {
  const lat = parseFloat(req.query.lat) || BASE_LAT;
  const lng = parseFloat(req.query.lng) || BASE_LNG;
  const count = 8 + Math.floor(Math.random() * 10);
  res.json({ vehicles: generateVehicles(lat, lng, count), total: count });
});

app.get('/api/rides', (req, res) => {
  const lat = parseFloat(req.query.lat) || BASE_LAT;
  const lng = parseFloat(req.query.lng) || BASE_LNG;
  res.json({ offers: generateRideOffers(lat, lng) });
});

app.get('/api/cartridge', (req, res) => {
  const hoursUsed = Math.floor(Math.random() * 60);
  const totalLife = 120;
  const remaining = totalLife - hoursUsed;
  const percent = Math.round((remaining / totalLife) * 100);
  res.json({
    hoursUsed, totalLife, remaining, percent,
    needsReplacement: percent < 20,
    message: percent < 20 ? 'Replace cartridge soon!' : 'Cartridge OK',
    co2: Math.round(400 + Math.random() * 600)
  });
});

app.get('/api/exposure', (req, res) => {
  const hoursPoorAQI = (Math.random() * 5).toFixed(1);
  const score = Math.round(Math.max(30, 100 - parseFloat(hoursPoorAQI) * 15));
  res.json({
    hoursPoorAQI, score,
    totalOrders: 7, totalEarnings: 1250, onlineTime: '4h 15m'
  });
});

app.get('/api/user', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = 1').get();
  res.json(user);
});

app.get('/api/route', async (req, res) => {
  const { origin, destination } = req.query;
  if (!origin || !destination) return res.json({ error: 'origin and destination required' });
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin};${destination}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      res.json({
        coordinates: route.geometry.coordinates,
        distance: (route.distance / 1000).toFixed(1),
        duration: Math.round(route.duration / 60)
      });
    } else {
      res.json({ error: 'No route found' });
    }
  } catch (err) {
    res.json({ error: 'Route fetch failed' });
  }
});

app.post('/api/sos', (req, res) => {
  const { lat, lng, nearestPolice, policePhone } = req.body || {};
  db.prepare('INSERT INTO sos_events (status) VALUES (?)').run('active');
  io.emit('sos_alert', {
    message: 'SOS TRIGGERED',
    timestamp: new Date().toISOString(),
    lat: lat || BASE_LAT,
    lng: lng || BASE_LNG,
    nearestPolice: nearestPolice || 'Unknown',
    policePhone: policePhone || '112'
  });
  console.log(`SOS TRIGGERED at ${lat}, ${lng} — Nearest: ${nearestPolice} (${policePhone})`);
  res.json({ success: true, message: 'SOS sent to emergency contacts and nearest police station' });
});

// ============ WEBSOCKET ============
let offerCounter = 0;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  const sensorInterval = setInterval(() => {
    const aqiData = generateAQI();
    const level = getAQILevel(aqiData.aqi);
    socket.emit('sensor_update', { ...aqiData, ...level });
  }, 3000);

  // Send new ride offer every 15-25 seconds
  const offerInterval = setInterval(() => {
    const offers = generateRideOffers(BASE_LAT, BASE_LNG);
    const newOffer = offers[Math.floor(Math.random() * offers.length)];
    newOffer.id = ++offerCounter;
    socket.emit('new_offer', newOffer);
  }, 15000 + Math.random() * 10000);

  socket.on('disconnect', () => {
    clearInterval(sensorInterval);
    clearInterval(offerInterval);
    console.log('Client disconnected:', socket.id);
  });
});

// ============ START ============
const PORT = 3001;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
