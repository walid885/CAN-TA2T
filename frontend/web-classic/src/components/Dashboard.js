import { useState, useEffect } from 'react';
import { Grid, Paper, Box, AppBar, Toolbar, Typography, IconButton } from '@mui/material';
import { Settings, Download } from '@mui/icons-material';
import MetricCard from './MetricCard';
import TimeSeriesChart from './TimeSeriesChart';
import DistributionChart from './DistributionChart';
import CorrelationMatrix from './CorrelationMatrix';
import AnomalyList from './AnomalyList';
import MessageRateChart from './MessageRateChart';
import ControlPanel from './ControlPanel';
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

  useEffect(() => {
    wsService.connect();
    const unsubscribe = wsService.subscribe((data) => {
      if (data.type === 'update') {
        setLatestData(data.data);
      }
    });

    fetchTimeSeries();
    fetchCorrelations();
    fetchMessageRate();

    const interval = setInterval(() => {
      fetchTimeSeries();
      fetchCorrelations();
      fetchMessageRate();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      wsService.disconnect();
    };
  }, [timeRange]);

  const fetchTimeSeries = async () => {
    try {
      const response = await api.getAllTimeSeries(timeRange, '1 second');
      setTimeSeriesData(response.data);
    } catch (err) {
      console.error('Error fetching time series:', err);
    }
  };

  const fetchCorrelations = async () => {
    try {
      const response = await api.getCorrelations(timeRange);
      setCorrelations(response.data);
    } catch (err) {
      console.error('Error fetching correlations:', err);
    }
  };

  const fetchMessageRate = async () => {
    try {
      const response = await api.getMessageRate(timeRange);
      setMessageRate(response.data);
    } catch (err) {
      console.error('Error fetching message rate:', err);
    }
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
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#0a0e27', minHeight: '100vh' }}>
      <AppBar position="static" sx={{ bgcolor: '#1a1f3a' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            CAN Bus Analytics Dashboard
          </Typography>
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
        />
      )}

      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {latestData.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={item.signal_name}>
              <MetricCard data={item} />
            </Grid>
          ))}

          {selectedSignals.map((signal) => (
            <Grid item xs={12} md={6} key={signal}>
              <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff' }}>
                <TimeSeriesChart
                  signal={signal}
                  data={timeSeriesData[signal] || []}
                  timeRange={timeRange}
                />
              </Paper>
            </Grid>
          ))}

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff' }}>
              <MessageRateChart data={messageRate} />
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff' }}>
              <CorrelationMatrix data={correlations} />
            </Paper>
          </Grid>

          {selectedSignals.map((signal) => (
            <Grid item xs={12} md={6} key={`dist-${signal}`}>
              <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff' }}>
                <DistributionChart signal={signal} timeRange={timeRange} />
              </Paper>
            </Grid>
          ))}

          {selectedSignals.map((signal) => (
            <Grid item xs={12} md={6} key={`anom-${signal}`}>
              <Paper sx={{ p: 2, bgcolor: '#1a1f3a', color: '#fff' }}>
                <AnomalyList signal={signal} timeRange={timeRange} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}