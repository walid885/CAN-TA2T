import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const api = {
  // Existing methods...
  
  // Raw message methods
  getRawMessages: (minutes = 5, limit = 1000) =>
    axios.get(`${API_BASE}/api/messages/raw`, {
      params: { minutes, limit }
    }),

  getMessageByCanId: (canId, minutes = 5) =>
    axios.get(`${API_BASE}/api/messages/raw/${canId}`, {
      params: { minutes }
    }),

  searchMessages: (search, minutes = 5) =>
    axios.get(`${API_BASE}/api/messages/search`, {
      params: { search, minutes }
    }),

  getMessageStats: (minutes = 5) =>
    axios.get(`${API_BASE}/api/messages/stats`, {
      params: { minutes }
    }),

  getMessagesByTimeRange: (startTime, endTime) =>
    axios.get(`${API_BASE}/api/messages/timerange`, {
      params: { startTime, endTime }
    }),

  // Existing methods
  getLatestSignals: () => axios.get(`${API_BASE}/api/signals/latest`),
  getTimeSeries: (signal, minutes, interval) =>
    axios.get(`${API_BASE}/api/signals/timeseries`, {
      params: { signal, minutes, interval }
    }),
  getAllTimeSeries: (minutes, interval) =>
    axios.get(`${API_BASE}/api/signals/all-timeseries`, {
      params: { minutes, interval }
    }),
  getSignalStats: (signal, minutes) =>
    axios.get(`${API_BASE}/api/signals/stats`, {
      params: { signal, minutes }
    }),
  getAnomalies: (signal, minutes, threshold) =>
    axios.get(`${API_BASE}/api/analytics/anomalies`, {
      params: { signal, minutes, threshold }
    }),
  getCorrelations: (minutes) =>
    axios.get(`${API_BASE}/api/analytics/correlations`, {
      params: { minutes }
    }),
  getDistribution: (signal, minutes, bins) =>
    axios.get(`${API_BASE}/api/analytics/distribution`, {
      params: { signal, minutes, bins }
    }),
  getMessageRate: (minutes) =>
    axios.get(`${API_BASE}/api/analytics/message-rate`, {
      params: { minutes }
    }),
  exportCSV: (signal, minutes) =>
    axios.get(`${API_BASE}/api/export/csv`, {
      params: { signal, minutes },
      responseType: 'blob'
    }),
  exportJSON: (signal, minutes) =>
    axios.get(`${API_BASE}/api/export/json`, {
      params: { signal, minutes },
      responseType: 'blob'
    })
};