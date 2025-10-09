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
import { 
    Box, 
    Paper, 
    Button, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Chip, 
    Typography,
    Divider,
    Stack
  } from '@mui/material';
  import { Download, Refresh, FilterList } from '@mui/icons-material';
  
  export default function ControlPanel({ 
    timeRange, 
    setTimeRange, 
    selectedSignals, 
    setSelectedSignals, 
    onExport,
    onRefresh 
  }) {
    const availableSignals = ['RPM', 'Speed', 'CoolantTemp', 'ThrottlePosition', 'FuelLevel', 'BatteryVoltage'];
  
    const handleSignalToggle = (signal) => {
      setSelectedSignals(prev =>
        prev.includes(signal)
          ? prev.filter(s => s !== signal)
          : [...prev, signal]
      );
    };
  
    const handleSelectAll = () => {
      setSelectedSignals(availableSignals);
    };
  
    const handleClearAll = () => {
      setSelectedSignals([]);
    };
  
    return (
      <Paper sx={{ p: 3, m: 2, bgcolor: '#1a1f3a', borderRadius: 2 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" sx={{ color: '#8892b0', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList fontSize="small" />
              Time Range
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                sx={{ 
                  color: '#fff',
                  bgcolor: '#0f1729',
                  '.MuiOutlinedInput-notchedOutline': { borderColor: '#2d3748' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#667eea' }
                }}
              >
                <MenuItem value={1}>Last 1 minute</MenuItem>
                <MenuItem value={5}>Last 5 minutes</MenuItem>
                <MenuItem value={15}>Last 15 minutes</MenuItem>
                <MenuItem value={30}>Last 30 minutes</MenuItem>
                <MenuItem value={60}>Last 1 hour</MenuItem>
                <MenuItem value={180}>Last 3 hours</MenuItem>
                <MenuItem value={360}>Last 6 hours</MenuItem>
              </Select>
            </FormControl>
          </Box>
  
          <Divider sx={{ borderColor: '#2d3748' }} />
  
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ color: '#8892b0' }}>
                Signal Selection
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  size="small" 
                  onClick={handleSelectAll}
                  sx={{ color: '#667eea', fontSize: '0.75rem' }}
                >
                  Select All
                </Button>
                <Button 
                  size="small" 
                  onClick={handleClearAll}
                  sx={{ color: '#ef4444', fontSize: '0.75rem' }}
                >
                  Clear
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {availableSignals.map(signal => (
                <Chip
                  key={signal}
                  label={signal}
                  onClick={() => handleSignalToggle(signal)}
                  sx={{
                    bgcolor: selectedSignals.includes(signal) ? '#667eea' : '#2d3748',
                    color: '#fff',
                    fontWeight: selectedSignals.includes(signal) ? 600 : 400,
                    '&:hover': { 
                      bgcolor: selectedSignals.includes(signal) ? '#5568d3' : '#3d4758',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s'
                    },
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Box>
          </Box>
  
          <Divider sx={{ borderColor: '#2d3748' }} />
  
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={onRefresh}
              sx={{ 
                bgcolor: '#2d3748', 
                '&:hover': { bgcolor: '#3d4758' },
                flex: 1,
                minWidth: '120px'
              }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => onExport('csv')}
              sx={{ 
                bgcolor: '#667eea', 
                '&:hover': { bgcolor: '#5568d3' },
                flex: 1,
                minWidth: '120px'
              }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => onExport('json')}
              sx={{ 
                bgcolor: '#667eea', 
                '&:hover': { bgcolor: '#5568d3' },
                flex: 1,
                minWidth: '120px'
              }}
            >
              Export JSON
            </Button>
          </Box>
        </Stack>
      </Paper>
    );
  }
  import { useState, useEffect } from 'react';
import { 
  Grid, 
  Paper, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import { Settings, Download, Notifications } from '@mui/icons-material';
import MetricCard from './MetricCard';
import TimeSeriesChart from './TimeSeriesChart';
import DistributionChart from './DistributionChart';
import CorrelationMatrix from './CorrelationMatrix';
import AnomalyList from './AnomalyList';
import MessageRateChart from './MessageRateChart';
import ControlPanel from './ControlPanel';
import StatsPanel from './StatsPanel';
import wsService from '../services/websocket';
import { api } from '../services/api';

export default function Dashboard() {
  const [latestData, setLatestData] = useState([]);
  const [timeSeriesData, setTimeSeriesData] = useState({});
  const [selectedSignals, setSelectedSignals] = useState(['RPM', 'Speed']);
  const [timeRange, setTimeRange] = useState(5);
  const [showControls, setShowControls] = useState(false);
  const [correlations, setCorrelations] = useState([]);
  const [messageRate, setMessageRate] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    wsService.connect();
    const unsubscribe = wsService.subscribe((data) => {
      if (data.type === 'update') {
        setLatestData(data.data);
        setWsConnected(true);
      }
    });

    fetchAllData();
    const interval = setInterval(fetchAllData, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      wsService.disconnect();
    };
  }, [timeRange]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchTimeSeries(),
        fetchCorrelations(),
        fetchMessageRate()
      ]);
    } catch (err) {
      showNotification('Error fetching data', 'error');
    }
  };

  const fetchTimeSeries = async () => {
    const response = await api.getAllTimeSeries(timeRange, '1 second');
    setTimeSeriesData(response.data);
  };

  const fetchCorrelations = async () => {
    const response = await api.getCorrelations(timeRange);
    setCorrelations(response.data);
  };

  const fetchMessageRate = async () => {
    const response = await api.getMessageRate(timeRange);
    setMessageRate(response.data);
  };

  const handleExport = async (format) => {
    try {
      const response = format === 'csv' 
        ? await api.exportCSV(null, timeRange)
        : await api.exportJSON(null, timeRange);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `canbus_export_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showNotification(`Exported successfully as ${format.toUpperCase()}`, 'success');
    } catch (err) {
      showNotification('Export failed', 'error');
    }
  };

  const handleRefresh = () => {
    fetchAllData();
    showNotification('Data refreshed', 'success');
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#0a0e27', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#1a1f3a', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <Toolbar>
          <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700 }}>
            🚗 CAN Bus Analytics Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: wsConnected ? '#10b981' : '#ef4444',
                animation: wsConnected ? 'pulse 2s infinite' : 'none',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 }
                }
              }}
            />
            <Typography variant="caption" sx={{ color: '#8892b0', mr: 2 }}>
              {wsConnected ? 'Connected' : 'Disconnected'}
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={() => handleExport('csv')}>
            <Download />
          </IconButton>
          <IconButton color="inherit" onClick={() => setShowControls(!showControls)}>
            <Settings />
          </IconButton>
        </Toolbar>
      </AppBar>

      {showControls && (
        <ControlPanel
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          selectedSignals={selectedSignals}
          setSelectedSignals={setSelectedSignals}
          onExport={handleExport}
          onRefresh={handleRefresh}
        />
      )}

      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Metric Cards */}
          {latestData.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={item.signal_name}>
              <MetricCard data={item} />
            </Grid>
          ))}

          {/* Time Series Charts */}
          {selectedSignals.map((signal) => (
            <Grid item xs={12} lg={6} key={signal}>
              <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff', borderRadius: 2 }}>
                <TimeSeriesChart
                  signal={signal}
                  data={timeSeriesData[signal] || []}
                  timeRange={timeRange}
                />
              </Paper>
            </Grid>
          ))}

          {/* Stats Panels */}
          {selectedSignals.map((signal) => (
            <Grid item xs={12} key={`stats-${signal}`}>
              <StatsPanel signal={signal} timeRange={timeRange} />
            </Grid>
          ))}

          {/* Message Rate */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff', borderRadius: 2 }}>
              <MessageRateChart data={messageRate} />
            </Paper>
          </Grid>

          {/* Correlations */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff', borderRadius: 2 }}>
              <CorrelationMatrix data={correlations} />
            </Paper>
          </Grid>

          {/* Distributions */}
          {selectedSignals.map((signal) => (
            <Grid item xs={12} md={6} key={`dist-${signal}`}>
              <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff', borderRadius: 2 }}>
                <DistributionChart signal={signal} timeRange={timeRange} />
              </Paper>
            </Grid>
          ))}

          {/* Anomalies */}
          {selectedSignals.map((signal) => (
            <Grid item xs={12} md={6} key={`anom-${signal}`}>
              <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff', borderRadius: 2 }}>
                <AnomalyList signal={signal} timeRange={timeRange} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', right: 'right' }}
      >
        <Alert 
          severity={notification.severity}
          sx={{ bgcolor: '#1a1f3a', color: '#fff' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

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