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