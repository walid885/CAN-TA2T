import { useState, useEffect } from 'react';
import { Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { api } from '../services/api';

export default function AnomalyList({ signal, timeRange }) {
  const [anomalies, setAnomalies] = useState([]);

  useEffect(() => {
    fetchAnomalies();
  }, [signal, timeRange]);

  const fetchAnomalies = async () => {
    try {
      const response = await api.getAnomalies(signal, timeRange, 3);
      setAnomalies(response.data);
    } catch (err) {
      console.error('Error fetching anomalies:', err);
    }
  };

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Warning color="warning" />
        {signal} Anomalies
      </Typography>
      <List sx={{ maxHeight: 300, overflow: 'auto' }}>
        {anomalies.slice(0, 10).map((item, idx) => (
          <ListItem
            key={idx}
            sx={{
              bgcolor: '#0f1729',
              mb: 1,
              borderRadius: 1,
              border: '1px solid #2d3748'
            }}
          >
            <ListItemText
              primary={
                <>
                  Value: {item.physical_value.toFixed(2)}
                  <Chip
                    label={`Z-Score: ${item.z_score.toFixed(2)}`}
                    size="small"
                    sx={{ ml: 2, bgcolor: '#ef4444', color: '#fff' }}
                  />
                </>
              }
              secondary={new Date(item.timestamp).toLocaleString()}
              primaryTypographyProps={{ color: '#fff' }}
              secondaryTypographyProps={{ color: '#64748b' }}
            />
          </ListItem>
        ))}
      </List>
      {anomalies.length === 0 && (
        <Typography variant="body2" sx={{ color: '#64748b', mt: 2 }}>
          No anomalies detected
        </Typography>
      )}
    </>
  );
}
