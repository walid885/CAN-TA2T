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