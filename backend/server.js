import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import routes from './src/routes/index.js';
import { setupWebSocket } from './websocket/wsServer.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupWebSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/ws`);
});