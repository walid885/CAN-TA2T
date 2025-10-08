import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Typography } from '@mui/material';
import { api } from '../services/api';

export default function DistributionChart({ signal, timeRange }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchDistribution();
  }, [signal, timeRange]);

  const fetchDistribution = async () => {
    try {
      const response = await api.getDistribution(signal, timeRange, 20);
      const formatted = response.data.map(d => ({
        range: `${d.bin_start.toFixed(1)}-${d.bin_end.toFixed(1)}`,
        frequency: d.frequency
      }));
      setData(formatted);
    } catch (err) {
      console.error('Error fetching distribution:', err);
    }
  };

  return (
    <>
      <Typography variant="h6" gutterBottom>
        {signal} Distribution
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis dataKey="range" stroke="#8892b0" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" />
          <YAxis stroke="#8892b0" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1a1f3a', border: '1px solid #2d3748' }}
            labelStyle={{ color: '#8892b0' }}
          />
          <Bar dataKey="frequency" fill="#667eea" />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}