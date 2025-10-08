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