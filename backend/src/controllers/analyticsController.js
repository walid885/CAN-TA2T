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