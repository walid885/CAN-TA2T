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

  // NEW: Filter by multiple CAN IDs
  async filterByCanIds(req, res) {
    const pool = getPool();
    const { canIds } = req.query; // comma-separated string
    const minutes = parseInt(req.query.minutes) || 5;
    const limit = parseInt(req.query.limit) || 1000;

    try {
      const idArray = canIds.split(',').map(id => id.trim());
      
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
        WHERE can_id = ANY($1)
          AND timestamp > NOW() - INTERVAL '${minutes} minutes'
        ORDER BY timestamp DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [idArray, limit]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error filtering by CAN IDs:', error);
      res.status(500).json({ error: 'Failed to filter messages' });
    }
  }

  // NEW: Filter by signal types
  async filterByTypes(req, res) {
    const pool = getPool();
    const { types } = req.query; // comma-separated string
    const minutes = parseInt(req.query.minutes) || 5;
    const limit = parseInt(req.query.limit) || 1000;

    try {
      const typeArray = types.split(',').map(t => t.trim());
      
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
        WHERE signal_type = ANY($1)
          AND timestamp > NOW() - INTERVAL '${minutes} minutes'
        ORDER BY timestamp DESC
        LIMIT $2
      `;

      const result = await pool.query(query, [typeArray, limit]);
      res.json(result.rows);
    } catch (error) {
      console.error('Error filtering by types:', error);
      res.status(500).json({ error: 'Failed to filter messages' });
    }
  }

  // NEW: Get unique CAN IDs
  async getUniqueCanIds(req, res) {
    const pool = getPool();
    const minutes = parseInt(req.query.minutes) || 60;

    try {
      const query = `
        SELECT DISTINCT can_id
        FROM can_messages
        WHERE timestamp > NOW() - INTERVAL '${minutes} minutes'
        ORDER BY can_id
      `;

      const result = await pool.query(query);
      res.json(result.rows.map(r => r.can_id));
    } catch (error) {
      console.error('Error fetching unique CAN IDs:', error);
      res.status(500).json({ error: 'Failed to fetch CAN IDs' });
    }
  }

  // NEW: Advanced filter with multiple criteria
  async advancedFilter(req, res) {
    const pool = getPool();
    const { canIds, types, signals, minutes = 5, limit = 1000 } = req.query;

    try {
      let conditions = [`timestamp > NOW() - INTERVAL '${minutes} minutes'`];
      let params = [];
      let paramIndex = 1;

      if (canIds) {
        const idArray = canIds.split(',').map(id => id.trim());
        conditions.push(`can_id = ANY($${paramIndex})`);
        params.push(idArray);
        paramIndex++;
      }

      if (types) {
        const typeArray = types.split(',').map(t => t.trim());
        conditions.push(`signal_type = ANY($${paramIndex})`);
        params.push(typeArray);
        paramIndex++;
      }

      if (signals) {
        const signalArray = signals.split(',').map(s => s.trim());
        conditions.push(`signal_name = ANY($${paramIndex})`);
        params.push(signalArray);
        paramIndex++;
      }

      params.push(limit);

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
        WHERE ${conditions.join(' AND ')}
        ORDER BY timestamp DESC
        LIMIT $${paramIndex}
      `;

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error('Error with advanced filter:', error);
      res.status(500).json({ error: 'Failed to filter messages' });
    }
  }
}

module.exports = new RawMessageController();