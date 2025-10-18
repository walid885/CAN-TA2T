import express from 'express';
const router = express.Router();

import * as signalController from '../controllers/signalController.js';
import * as exportController from '../controllers/exportController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import rawMessageController from '../controllers/rawMessageController.js';

// Existing signal routes
router.get('/signals/latest', signalController.getLatestSignals);
router.get('/signals/timeseries/:signal', signalController.getSignalTimeSeries);
router.get('/signals/all-timeseries', signalController.getAllTimeSeries);
router.get('/signals/stats/:signal', signalController.getSignalStats);
router.get('/signals/list', signalController.getSignalList);

// Analytics routes
router.get('/analytics/anomalies/:signal', analyticsController.getAnomalies);
router.get('/analytics/correlations', analyticsController.getCorrelationMatrix);
router.get('/analytics/distribution/:signal', analyticsController.getSignalDistribution);
router.get('/analytics/message-rate', analyticsController.getMessageRate);
router.get('/analytics/anomalies/:signal', analyticsController.getAnomalies);
router.get('/analytics/distribution/:signal', analyticsController.getSignalDistribution);

// Signal routes - add :signal param
router.get('/signals/stats/:signal', signalController.getSignalStats);


// Export routes
router.get('/export/csv', exportController.exportCSV);
router.get('/export/json', exportController.exportJSON);

// Raw message routes
router.get('/messages/raw', rawMessageController.getRawMessages.bind(rawMessageController));
router.get('/messages/raw/:canId', rawMessageController.getMessageByCanId.bind(rawMessageController));
router.get('/messages/search', rawMessageController.searchMessages.bind(rawMessageController));
router.get('/messages/stats', rawMessageController.getMessageStats.bind(rawMessageController));
router.get('/messages/timerange', rawMessageController.getMessagesByTimeRange.bind(rawMessageController));

// Advanced filtering routes
router.get('/messages/filter/canids', rawMessageController.filterByCanIds.bind(rawMessageController));
router.get('/messages/filter/types', rawMessageController.filterByTypes.bind(rawMessageController));
router.get('/messages/filter/advanced', rawMessageController.advancedFilter.bind(rawMessageController));
router.get('/messages/unique-canids', rawMessageController.getUniqueCanIds.bind(rawMessageController));

export default router;