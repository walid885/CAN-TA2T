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

// Initialize database
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

const express = require('express');
const router = express.Router();

const signalController = require('../controllers/signalController');
const analyticsController = require('../controllers/analyticsController');
const exportController = require('../controllers/exportController');
const rawMessageController = require('../controllers/rawMessageController');

// Existing routes
router.get('/signals/latest', signalController.getLatestSignals);
router.get('/signals/timeseries', signalController.getTimeSeries);
router.get('/signals/all-timeseries', signalController.getAllTimeSeries);
router.get('/signals/stats', signalController.getSignalStats);

router.get('/analytics/anomalies', analyticsController.getAnomalies);
router.get('/analytics/correlations', analyticsController.getCorrelations);
router.get('/analytics/distribution', analyticsController.getDistribution);
router.get('/analytics/message-rate', analyticsController.getMessageRate);

router.get('/export/csv', exportController.exportCSV);
router.get('/export/json', exportController.exportJSON);

// New raw message routes
router.get('/messages/raw', rawMessageController.getRawMessages);
router.get('/messages/raw/:canId', rawMessageController.getMessageByCanId);
router.get('/messages/search', rawMessageController.searchMessages);
router.get('/messages/stats', rawMessageController.getMessageStats);
router.get('/messages/timerange', rawMessageController.getMessagesByTimeRange);

module.exports = router;

import pool from '../config/database.js';

export const getLatestSignals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (signal_name) 
        signal_name,
        physical_value,
        unit,
        timestamp,
        signal_type,
        can_id
      FROM can_messages
      ORDER BY signal_name, timestamp DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSignalTimeSeries = async (req, res) => {
  const { signal } = req.params;
  const { minutes = 5, bucket = '1 second' } = req.query;
  
  try {
    const result = await pool.query(`
      SELECT 
        time_bucket($1, timestamp) AS time,
        AVG(physical_value) as avg_value,
        MIN(physical_value) as min_value,
        MAX(physical_value) as max_value,
        unit
      FROM can_messages
      WHERE signal_name = $2 
        AND timestamp > NOW() - INTERVAL '${minutes} minutes'
      GROUP BY time, unit
      ORDER BY time ASC
    `, [bucket, signal]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllTimeSeries = async (req, res) => {
  const { minutes = 5, bucket = '1 second' } = req.query;
  
  try {
    const result = await pool.query(`
      SELECT 
        time_bucket($1, timestamp) AS time,
        signal_name,
        AVG(physical_value) as value,
        unit
      FROM can_messages
      WHERE timestamp > NOW() - INTERVAL '${minutes} minutes'
      GROUP BY time, signal_name, unit
      ORDER BY time ASC, signal_name
    `, [bucket]);
    
    const grouped = result.rows.reduce((acc, row) => {
      if (!acc[row.signal_name]) acc[row.signal_name] = [];
      acc[row.signal_name].push({
        time: row.time,
        value: parseFloat(row.value),
        unit: row.unit
      });
      return acc;
    }, {});
    
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSignalStats = async (req, res) => {
  const { signal } = req.params;
  const { minutes = 60 } = req.query;
  
  try {
    const result = await pool.query(`
      SELECT 
        signal_name,
        MIN(physical_value) as min_value,
        MAX(physical_value) as max_value,
        AVG(physical_value) as avg_value,
        STDDEV(physical_value) as stddev_value,
        COUNT(*) as count,
        unit
      FROM can_messages
      WHERE signal_name = $1 
        AND timestamp > NOW() - INTERVAL '${minutes} minutes'
      GROUP BY signal_name, unit
    `, [signal]);
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSignalList = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT DISTINCT signal_name, signal_type, unit
      FROM can_messages
      ORDER BY signal_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const { getPool } = require('../config/database');

class RawMessageController {
  async getRawMessages(req, res) {
    const pool = getPool();
    const minutes = parseInt(req.query.minutes) || 5;
    const limit = parseInt(req.query.limit) || 1000;

    try {
      const query = `
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
        WHERE timestamp > NOW() - INTERVAL '${minutes} minutes'
        ORDER BY timestamp DESC
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching raw messages:', error);
      res.status(500).json({ error: 'Failed to fetch raw messages' });
    }
  }

  async getMessageByCanId(req, res) {
    const pool = getPool();
    const { canId } = req.params;
    const minutes = parseInt(req.query.minutes) || 5;

    try {
      const query = `
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
        WHERE can_id = $1
          AND timestamp > NOW() - INTERVAL '${minutes} minutes'
        ORDER BY timestamp DESC
        LIMIT 500
      `;

      const result = await pool.query(query, [canId]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching messages by CAN ID:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }

  async searchMessages(req, res) {
    const pool = getPool();
    const { search } = req.query;
    const minutes = parseInt(req.query.minutes) || 5;

    try {
      const query = `
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
        WHERE timestamp > NOW() - INTERVAL '${minutes} minutes'
          AND (
            can_id ILIKE $1
            OR signal_type ILIKE $1
            OR signal_name ILIKE $1
            OR data_hex ILIKE $1
          )
        ORDER BY timestamp DESC
        LIMIT 1000
      `;

      const result = await pool.query(query, [`%${search}%`]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error searching messages:', error);
      res.status(500).json({ error: 'Failed to search messages' });
    }
  }

  async getMessageStats(req, res) {
    const pool = getPool();
    const minutes = parseInt(req.query.minutes) || 5;

    try {
      const query = `
        SELECT 
          COUNT(*) as total_messages,
          COUNT(DISTINCT can_id) as unique_can_ids,
          COUNT(DISTINCT signal_type) as unique_types,
          COUNT(DISTINCT signal_name) as unique_signals,
          MIN(timestamp) as oldest_message,
          MAX(timestamp) as newest_message
        FROM can_messages
        WHERE timestamp > NOW() - INTERVAL '${minutes} minutes'
      `;

      const result = await pool.query(query);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error fetching message stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  async getMessagesByTimeRange(req, res) {
    const pool = getPool();
    const { startTime, endTime } = req.query;

    try {
      const query = `
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
        WHERE timestamp BETWEEN $1 AND $2
        ORDER BY timestamp DESC
        LIMIT 5000
      `;

      const result = await pool.query(query, [startTime, endTime]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error fetching messages by time range:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  }
}

module.exports = new RawMessageController();

import pool from '../config/database.js';

export const exportCSV = async (req, res) => {
  const { signal, minutes = 60 } = req.query;
  
  try {
    const query = signal 
      ? `SELECT * FROM can_messages WHERE signal_name = $1 AND timestamp > NOW() - INTERVAL '${minutes} minutes' ORDER BY timestamp`
      : `SELECT * FROM can_messages WHERE timestamp > NOW() - INTERVAL '${minutes} minutes' ORDER BY timestamp`;
    
    const result = await pool.query(query, signal ? [signal] : []);
    
    const csv = [
      Object.keys(result.rows[0]).join(','),
      ...result.rows.map(row => Object.values(row).join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=canbus_export_${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const exportJSON = async (req, res) => {
  const { signal, minutes = 60 } = req.query;
  
  try {
    const query = signal 
      ? `SELECT * FROM can_messages WHERE signal_name = $1 AND timestamp > NOW() - INTERVAL '${minutes} minutes' ORDER BY timestamp`
      : `SELECT * FROM can_messages WHERE timestamp > NOW() - INTERVAL '${minutes} minutes' ORDER BY timestamp`;
    
    const result = await pool.query(query, signal ? [signal] : []);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=canbus_export_${Date.now()}.json`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
import pool from '../config/database.js';

export const getCorrelationMatrix = async (req, res) => {
  const { minutes = 60 } = req.query;
  
  try {
    const signals = await pool.query(`
      SELECT DISTINCT signal_name FROM can_messages
      WHERE timestamp > NOW() - INTERVAL '${minutes} minutes'
    `);
    
    const correlations = [];
    for (let i = 0; i < signals.rows.length; i++) {
      for (let j = i + 1; j < signals.rows.length; j++) {
        const result = await pool.query(`
          WITH signal_data AS (
            SELECT 
              time_bucket('1 second', timestamp) as bucket,
              signal_name,
              AVG(physical_value) as value
            FROM can_messages
            WHERE signal_name IN ($1, $2)
              AND timestamp > NOW() - INTERVAL '${minutes} minutes'
            GROUP BY bucket, signal_name
          )
          SELECT 
            CORR(s1.value, s2.value) as correlation
          FROM 
            (SELECT bucket, value FROM signal_data WHERE signal_name = $1) s1
          INNER JOIN 
            (SELECT bucket, value FROM signal_data WHERE signal_name = $2) s2
          ON s1.bucket = s2.bucket
        `, [signals.rows[i].signal_name, signals.rows[j].signal_name]);
        
        if (result.rows[0].correlation !== null) {
          correlations.push({
            signal1: signals.rows[i].signal_name,
            signal2: signals.rows[j].signal_name,
            correlation: parseFloat(result.rows[0].correlation)
          });
        }
      }
    }
    
    res.json(correlations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAnomalies = async (req, res) => {
  const { signal } = req.params;
  const { minutes = 60, threshold = 3 } = req.query;
  
  try {
    const result = await pool.query(`
      WITH stats AS (
        SELECT 
          AVG(physical_value) as mean,
          STDDEV(physical_value) as stddev
        FROM can_messages
        WHERE signal_name = $1
          AND timestamp > NOW() - INTERVAL '${minutes} minutes'
      )
      SELECT 
        timestamp,
        physical_value,
        ABS(physical_value - stats.mean) / NULLIF(stats.stddev, 0) as z_score
      FROM can_messages, stats
      WHERE signal_name = $1
        AND timestamp > NOW() - INTERVAL '${minutes} minutes'
        AND ABS(physical_value - stats.mean) > $2 * stats.stddev
      ORDER BY timestamp DESC
      LIMIT 100
    `, [signal, threshold]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSignalDistribution = async (req, res) => {
  const { signal } = req.params;
  const { minutes = 60, bins = 20 } = req.query;
  
  try {
    const result = await pool.query(`
      WITH signal_range AS (
        SELECT 
          MIN(physical_value) as min_val,
          MAX(physical_value) as max_val
        FROM can_messages
        WHERE signal_name = $1
          AND timestamp > NOW() - INTERVAL '${minutes} minutes'
      ),
      histogram AS (
        SELECT 
          WIDTH_BUCKET(physical_value, min_val, max_val, $2) as bucket,
          COUNT(*) as frequency,
          min_val + (max_val - min_val) * (WIDTH_BUCKET(physical_value, min_val, max_val, $2) - 1) / $2::float as bin_start,
          min_val + (max_val - min_val) * WIDTH_BUCKET(physical_value, min_val, max_val, $2) / $2::float as bin_end
        FROM can_messages, signal_range
        WHERE signal_name = $1
          AND timestamp > NOW() - INTERVAL '${minutes} minutes'
        GROUP BY bucket, min_val, max_val
      )
      SELECT 
        bucket,
        frequency,
        bin_start,
        bin_end
      FROM histogram
      ORDER BY bucket
    `, [signal, bins]);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMessageRate = async (req, res) => {
  const { minutes = 5 } = req.query;
  
  try {
    const result = await pool.query(`
      SELECT 
        time_bucket('1 second', timestamp) AS time,
        signal_name,
        COUNT(*) as message_count
      FROM can_messages
      WHERE timestamp > NOW() - INTERVAL '${minutes} minutes'
      GROUP BY time, signal_name
      ORDER BY time ASC
    `);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

export default pool;