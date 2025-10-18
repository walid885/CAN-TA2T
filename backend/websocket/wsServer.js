const WebSocket = require('ws');
const { getPool } = require('../src/config/database');

let wss;

function initializeWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
      console.log('Received:', message);
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Poll database and broadcast updates
  setInterval(async () => {
    try {
      const pool = getPool();
      
      // Send latest aggregated data
      const latestQuery = `
        SELECT DISTINCT ON (signal_name)
          timestamp,
          can_id,
          signal_type,
          signal_name,
          raw_value,
          physical_value,
          unit,
          data_hex
        FROM can_messages
        WHERE timestamp > NOW() - INTERVAL '10 seconds'
        ORDER BY signal_name, timestamp DESC
      `;
      
      const latestResult = await pool.query(latestQuery);
      
      broadcast({
        type: 'update',
        data: latestResult.rows
      });

      // Send raw messages for live table
      const rawQuery = `
        SELECT 
          EXTRACT(EPOCH FROM timestamp) as timestamp,
          can_id,
          signal_type,
          signal_name,
          raw_value,
          physical_value,
          unit,
          data_hex
        FROM can_messages
        WHERE timestamp > NOW() - INTERVAL '2 seconds'
        ORDER BY timestamp DESC
        LIMIT 10
      `;
      
      const rawResult = await pool.query(rawQuery);
      
      if (rawResult.rows.length > 0) {
        rawResult.rows.forEach(msg => {
          broadcast({
            type: 'raw_message',
            data: msg
          });
        });
      }
      
    } catch (error) {
      console.error('Error broadcasting updates:', error);
    }
  }, 1000);

  console.log('WebSocket server initialized on /ws');
}

function broadcast(data) {
  if (!wss) return;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

module.exports = { initializeWebSocket, broadcast };