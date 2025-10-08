import express from 'express';
import * as signalController from '../controllers/signalController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as exportController from '../controllers/exportController.js';

const router = express.Router();

// Signal routes
router.get('/signals/latest', signalController.getLatestSignals);
router.get('/signals/list', signalController.getSignalList);
router.get('/signals/:signal/timeseries', signalController.getSignalTimeSeries);
router.get('/signals/:signal/stats', signalController.getSignalStats);
router.get('/signals/timeseries/all', signalController.getAllTimeSeries);

// Analytics routes
router.get('/analytics/correlations', analyticsController.getCorrelationMatrix);
router.get('/analytics/:signal/anomalies', analyticsController.getAnomalies);
router.get('/analytics/:signal/distribution', analyticsController.getSignalDistribution);
router.get('/analytics/message-rate', analyticsController.getMessageRate);

// Export routes
router.get('/export/csv', exportController.exportCSV);
router.get('/export/json', exportController.exportJSON);

export default router;