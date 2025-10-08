import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Typography, Box, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useState } from 'react';

export default function MessageRateChart({ data }) {
  const [viewMode, setViewMode] = useState('stacked');
  
  const signalColors = {
    RPM: '#667eea',
    Speed: '#f093fb',
    CoolantTemp: '#fad0c4',
    ThrottlePosition: '#a1c4fd',
    FuelLevel: '#ffeaa7',
    BatteryVoltage: '#81ecec'
  };

  const groupedData = data.reduce((acc, item) => {
    const time = new Date(item.time).toLocaleTimeString();
    const existing = acc.find(d => d.time === time);
    if (existing) {
      existing[item.signal_name] = item.message_count;
    } else {
      acc.push({
        time,
        [item.signal_name]: item.message_count
      });
    }
    return acc;
  }, []);

  const signals = [...new Set(data.map(d => d.signal_name))];
  
  const totalData = groupedData.map(item => ({
    time: item.time,
    total: signals.reduce((sum, signal) => sum + (item[signal] || 0), 0)
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Message Rate (msg/sec)
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, val) => val && setViewMode(val)}
          size="small"
        >
          <ToggleButton value="stacked" sx={{ color: '#8892b0', '&.Mui-selected': { color: '#fff', bgcolor: '#667eea' } }}>
            By Signal
          </ToggleButton>
          <ToggleButton value="total" sx={{ color: '#8892b0', '&.Mui-selected': { color: '#fff', bgcolor: '#667eea' } }}>
            Total
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={viewMode === 'total' ? totalData : groupedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis 
            dataKey="time" 
            stroke="#8892b0" 
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#8892b0" tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #2d3748' }}
            labelStyle={{ color: '#8892b0' }}
          />
          <Legend wrapperStyle={{ color: '#8892b0' }} />
          {viewMode === 'total' ? (
            <Line
              type="monotone"
              dataKey="total"
              stroke="#667eea"
              strokeWidth={2}
              dot={false}
              name="Total Messages"
            />
          ) : (
            signals.map(signal => (
              <Line
                key={signal}
                type="monotone"
                dataKey={signal}
                stroke={signalColors[signal] || '#667eea'}
                strokeWidth={2}
                dot={false}
                name={signal}
              />
            ))
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}