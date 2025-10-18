export const getSignalTimeSeries = async (req, res) => {
  const { signal } = req.params;
  const { minutes = 5, bucket = '1 second' } = req.query;
  
  try {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('second', timestamp) AS time,
        AVG(physical_value) as avg_value,
        MIN(physical_value) as min_value,
        MAX(physical_value) as max_value,
        unit
      FROM can_messages
      WHERE signal_name = $1 
        AND timestamp > NOW() - INTERVAL '${minutes} minutes'
      GROUP BY DATE_TRUNC('second', timestamp), unit
      ORDER BY time ASC
    `, [signal]);
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
        DATE_TRUNC('second', timestamp) AS time,
        signal_name,
        AVG(physical_value) as value,
        unit
      FROM can_messages
      WHERE timestamp > NOW() - INTERVAL '${minutes} minutes'
      GROUP BY DATE_TRUNC('second', timestamp), signal_name, unit
      ORDER BY time ASC, signal_name
    `);
    
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