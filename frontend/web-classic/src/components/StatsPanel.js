import { Box, Paper, Grid, Typography, LinearProgress } from '@mui/material';
import { TrendingUp, TrendingDown, ShowChart } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function StatsPanel({ signal, timeRange }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [signal, timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.getSignalStats(signal, timeRange);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 2, bgcolor: '#1a1f3a' }}>
        <LinearProgress sx={{ bgcolor: '#2d3748', '& .MuiLinearProgress-bar': { bgcolor: '#667eea' } }} />
      </Paper>
    );
  }

  if (!stats) return null;

  const statItems = [
    { label: 'Minimum', value: stats.min_value, icon: <TrendingDown />, color: '#ef4444' },
    { label: 'Maximum', value: stats.max_value, icon: <TrendingUp />, color: '#10b981' },
    { label: 'Average', value: stats.avg_value, icon: <ShowChart />, color: '#667eea' },
    { label: 'Std Dev', value: stats.stddev_value, icon: <ShowChart />, color: '#f093fb' }
  ];

  return (
    <Paper sx={{ p: 2, bgcolor: '#1a1f3a', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ color: '#fff' }}>
        {signal} Statistics
      </Typography>
      <Grid container spacing={2}>
        {statItems.map((item, idx) => (
          <Grid item xs={6} md={3} key={idx}>
            <Box
              sx={{
                p: 2,
                bgcolor: '#0f1729',
                borderRadius: 1,
                border: `1px solid ${item.color}20`,
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box sx={{ color: item.color }}>{item.icon}</Box>
                <Typography variant="caption" sx={{ color: '#8892b0' }}>
                  {item.label}
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ color: item.color, fontWeight: 700 }}>
                {item.value?.toFixed(2) || 'N/A'}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                {stats.unit}
              </Typography>
            </Box>
          </Grid>
        ))}
        <Grid item xs={12}>
          <Box sx={{ p: 2, bgcolor: '#0f1729', borderRadius: 1 }}>
            <Typography variant="caption" sx={{ color: '#8892b0' }}>
              Sample Count: <strong style={{ color: '#667eea' }}>{stats.count}</strong> messages
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}