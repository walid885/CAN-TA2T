import express from 'express';
import cors from 'cors';
import http from 'http';
import routes from './src/routes/index.js';
import { initializePool } from './src/config/database.js';
import { initializeWebSocket } from '/home/walid/Desktop/CAN-TA2T/backend/websocket/wsServer.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

//Initialize database
initializePool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'canbus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'canbus_pass',
});

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
initializeWebSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});