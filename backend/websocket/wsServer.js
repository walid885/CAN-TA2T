import { WebSocketServer } from 'ws';
import pool from '../src/config/database.js';

let clients = new Set();
let intervalId = null;

export const setupWebSocket = (server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        
        if (data.type === 'subscribe') {
          ws.subscriptions = data.signals || [];
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });
    
    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
      clients.delete(ws);
    });
  });
  
  startBroadcast();
  
  return wss;
};

const startBroadcast = () => {
  if (intervalId) clearInterval(intervalId);
  
  intervalId = setInterval(async () => {
    if (clients.size === 0) return;
    
    try {
      const result = await pool.query(`
        SELECT DISTINCT ON (signal_name) 
          signal_name,
          physical_value,
          unit,
          timestamp,
          signal_type
        FROM can_messages
        ORDER BY signal_name, timestamp DESC
      `);
      
      const data = JSON.stringify({
        type: 'update',
        timestamp: new Date().toISOString(),
        data: result.rows
      });
      
      clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(data);
        }
      });
    } catch (err) {
      console.error('Broadcast error:', err);
    }
  }, 1000);
};