import { Card, CardContent, Typography, Box } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

export default function MetricCard({ data }) {
  const getColor = (type) => {
    const colors = {
      ENGINE: '#667eea',
      VEHICLE: '#f093fb',
      FUEL: '#fad0c4',
      ELECTRICAL: '#a1c4fd'
    };
    return colors[type] || '#667eea';
  };

  return (
    <Card sx={{ 
      bgcolor: '#1a1f3a', 
      borderLeft: `4px solid ${getColor(data.signal_type)}`,
      transition: 'transform 0.2s',
      '&:hover': { transform: 'translateY(-4px)' }
    }}>
      <CardContent>
        <Typography variant="caption" sx={{ color: '#8892b0' }}>
          {data.signal_name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
            {data.physical_value.toFixed(2)}
          </Typography>
          <Typography variant="body2" sx={{ ml: 1, color: '#8892b0' }}>
            {data.unit}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: '#64748b' }}>
          {new Date(data.timestamp).toLocaleTimeString()}
        </Typography>
      </CardContent>
    </Card>
  );
}