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
              DATE_TRUNC('second', timestamp) as bucket,
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
        DATE_TRUNC('second', timestamp) AS time,
        signal_name,
        COUNT(*) as message_count
      FROM can_messages
      WHERE timestamp > NOW() - INTERVAL '${minutes} minutes'
      GROUP BY DATE_TRUNC('second', timestamp), signal_name
      ORDER BY time ASC
    `);
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};