import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Typography } from '@mui/material';

export default function MessageRateChart({ data }) {
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

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Message Rate (messages/second)
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={groupedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis dataKey="time" stroke="#8892b0" tick={{ fontSize: 10 }} />
          <YAxis stroke="#8892b0" tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #2d3748' }}
            labelStyle={{ color: '#8892b0' }}
          />
          <Legend />
          {signals.map(signal => (
            <Line
              key={signal}
              type="monotone"
              dataKey={signal}
              stroke={signalColors[signal] || '#667eea'}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}