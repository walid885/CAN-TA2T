import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const api = {
  // Signal endpoints
  getLatestSignals: () => apiClient.get('/signals/latest'),
  getAllTimeSeries: (minutes, bucket) => 
    apiClient.get('/signals/all-timeseries', { params: { minutes, bucket } }),
  getSignalStats: (signal, minutes) =>
    apiClient.get(`/signals/stats/${signal}`, { params: { minutes } }),

  // Analytics endpoints
  getCorrelations: (minutes) => 
    apiClient.get('/analytics/correlations', { params: { minutes } }),
  getAnomalies: (signal, minutes, threshold) =>
    apiClient.get(`/analytics/anomalies/${signal}`, { params: { minutes, threshold } }),
  getDistribution: (signal, minutes, bins) =>
    apiClient.get(`/analytics/distribution/${signal}`, { params: { minutes, bins } }),
  getMessageRate: (minutes) =>
    apiClient.get('/analytics/message-rate', { params: { minutes } }),

  // Export endpoints
  exportCSV: (signal, minutes) =>
    apiClient.get('/export/csv', { params: { signal, minutes } }),
  exportJSON: (signal, minutes) =>
    apiClient.get('/export/json', { params: { signal, minutes } }),

  // Raw message endpoints
  getRawMessages: (minutes, limit) =>
    apiClient.get('/messages/raw', { params: { minutes, limit } }),
  getMessageByCanId: (canId, minutes) =>
    apiClient.get(`/messages/raw/${canId}`, { params: { minutes } }),
  searchMessages: (search, minutes) =>
    apiClient.get('/messages/search', { params: { search, minutes } }),
  getMessageStats: (minutes) =>
    apiClient.get('/messages/stats', { params: { minutes } }),
  getMessagesByTimeRange: (startTime, endTime) =>
    apiClient.get('/messages/timerange', { params: { startTime, endTime } }),
  filterByCanIds: (canIds, minutes, limit) =>
    apiClient.get('/messages/filter/canids', { 
      params: { canIds: canIds.join(','), minutes, limit } 
    }),
  filterByTypes: (types, minutes, limit) =>
    apiClient.get('/messages/filter/types', { 
      params: { types: types.join(','), minutes, limit } 
    }),
  advancedFilter: (filters) =>
    apiClient.get('/messages/filter/advanced', { params: filters }),
  getUniqueCanIds: (minutes) =>
    apiClient.get('/messages/unique-canids', { params: { minutes } }),
};

export default api;