const express = require('express');
const router = express.Router();

const signalController = require('../controllers/signalController');
const analyticsController = require('../controllers/analyticsController');
const exportController = require('../controllers/exportController');
const rawMessageController = require('../controllers/rawMessageController');

// Existing routes
router.get('/signals/latest', signalController.getLatestSignals);
router.get('/signals/timeseries', signalController.getTimeSeries);
router.get('/signals/all-timeseries', signalController.getAllTimeSeries);
router.get('/signals/stats', signalController.getSignalStats);

router.get('/analytics/anomalies', analyticsController.getAnomalies);
router.get('/analytics/correlations', analyticsController.getCorrelations);
router.get('/analytics/distribution', analyticsController.getDistribution);
router.get('/analytics/message-rate', analyticsController.getMessageRate);

router.get('/export/csv', exportController.exportCSV);
router.get('/export/json', exportController.exportJSON);

// New raw message routes
router.get('/messages/raw', rawMessageController.getRawMessages);
router.get('/messages/raw/:canId', rawMessageController.getMessageByCanId);
router.get('/messages/search', rawMessageController.searchMessages);
router.get('/messages/stats', rawMessageController.getMessageStats);
router.get('/messages/timerange', rawMessageController.getMessagesByTimeRange);

module.exports = router;