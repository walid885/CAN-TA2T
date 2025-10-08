import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Typography } from '@mui/material';

export default function TimeSeriesChart({ signal, data, timeRange }) {
  const formattedData = data.map(d => ({
    time: new Date(d.time).toLocaleTimeString(),
    value: parseFloat(d.value)
  }));

  return (
    <>
      <Typography variant="h6" gutterBottom>
        {signal} - Last {timeRange} minutes
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis 
            dataKey="time" 
            stroke="#8892b0" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis stroke="#8892b0" tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #2d3748' }}
            labelStyle={{ color: '#8892b0' }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#667eea" 
            strokeWidth={2}
            dot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}