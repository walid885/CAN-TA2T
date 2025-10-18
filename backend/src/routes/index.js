import express from 'express';
const router = express.Router();

// 1. Use import syntax instead of require()
// Note: It's good practice in ESM to include the .js extension
import  * as signalController from '../controllers/signalController.js';
// RIGHT
import * as analyticsController from '../controllers/analyticsController.js';
import  * as rawMessageController from '../controllers/rawMessageController.js';

// Existing signal routes
router.get('/signals/latest', signalController.getLatestSignals);
router.get('/signals/timeseries', signalController.getTimeSeries);
router.get('/signals/all-timeseries', signalController.getAllTimeSeries);
router.get('/signals/stats', signalController.getSignalStats);

// Analytics routes
router.get('/analytics/anomalies', analyticsController.getAnomalies);
router.get('/analytics/correlations', analyticsController.getCorrelations);
router.get('/analytics/distribution', analyticsController.getDistribution);
router.get('/analytics/message-rate', analyticsController.getMessageRate);

// Export routes
router.get('/export/csv', exportController.exportCSV);
router.get('/export/json', exportController.exportJSON);

// Raw message routes
router.get('/messages/raw', rawMessageController.getRawMessages);
router.get('/messages/raw/:canId', rawMessageController.getMessageByCanId);
router.get('/messages/search', rawMessageController.searchMessages);
router.get('/messages/stats', rawMessageController.getMessageStats);
router.get('/messages/timerange', rawMessageController.getMessagesByTimeRange);

// NEW: Advanced filtering routes
router.get('/messages/filter/canids', rawMessageController.filterByCanIds);
router.get('/messages/filter/types', rawMessageController.filterByTypes);
router.get('/messages/filter/advanced', rawMessageController.advancedFilter);
router.get('/messages/unique-canids', rawMessageController.getUniqueCanIds);

// 2. Use "export default" instead of "module.exports"
export default router;