import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export const api = {
  getLatestSignals: () => axios.get(`${API_BASE}/signals/latest`),
  getSignalList: () => axios.get(`${API_BASE}/signals/list`),
  getSignalTimeSeries: (signal, minutes, bucket) => 
    axios.get(`${API_BASE}/signals/${signal}/timeseries`, { params: { minutes, bucket } }),
  getAllTimeSeries: (minutes, bucket) => 
    axios.get(`${API_BASE}/signals/timeseries/all`, { params: { minutes, bucket } }),
  getSignalStats: (signal, minutes) => 
    axios.get(`${API_BASE}/signals/${signal}/stats`, { params: { minutes } }),
  getCorrelations: (minutes) => 
    axios.get(`${API_BASE}/analytics/correlations`, { params: { minutes } }),
  getAnomalies: (signal, minutes, threshold) => 
    axios.get(`${API_BASE}/analytics/${signal}/anomalies`, { params: { minutes, threshold } }),
  getDistribution: (signal, minutes, bins) => 
    axios.get(`${API_BASE}/analytics/${signal}/distribution`, { params: { minutes, bins } }),
  getMessageRate: (minutes) => 
    axios.get(`${API_BASE}/analytics/message-rate`, { params: { minutes } }),
  exportCSV: (signal, minutes) => 
    axios.get(`${API_BASE}/export/csv`, { params: { signal, minutes }, responseType: 'blob' }),
  exportJSON: (signal, minutes) => 
    axios.get(`${API_BASE}/export/json`, { params: { signal, minutes }, responseType: 'blob' })
};