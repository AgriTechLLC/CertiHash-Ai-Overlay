const express = require('express');
const router = express.Router();
const metricsService = require('../services/metricsService');
const prometheusOptimizer = require('../services/prometheusOptimizer');
const { verifyToken } = require('../auth');

// All metrics routes require authentication
router.use(verifyToken);

/**
 * Execute Prometheus query with caching
 * @route GET /api/metrics/query
 */
router.get('/query', async (req, res) => {
  try {
    const { query, start, end, step, cache_time } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }
    
    // Build time range object if provided
    const timeRange = {};
    if (start) timeRange.start = start;
    if (end) timeRange.end = end;
    if (step) timeRange.step = step;
    
    // Convert cache_time to number if provided
    const cacheTime = cache_time ? parseInt(cache_time) : 60;
    
    const result = await metricsService.getMetrics(query, timeRange, cacheTime);
    
    res.json(result);
  } catch (error) {
    console.error('Error querying metrics:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to query metrics',
      error: error.message
    });
  }
});

/**
 * Get dashboard metrics
 * @route GET /api/metrics/dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const metrics = await metricsService.getDashboardMetrics();
    
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Error getting dashboard metrics:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard metrics',
      error: error.message
    });
  }
});

/**
 * Get transaction volume
 * @route GET /api/metrics/transaction-volume
 */
router.get('/transaction-volume', async (req, res) => {
  try {
    const { period } = req.query;
    const result = await metricsService.getTransactionVolume(period);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting transaction volume:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction volume',
      error: error.message
    });
  }
});

/**
 * Get app metrics
 * @route GET /api/metrics/apps
 */
router.get('/apps', async (req, res) => {
  try {
    const appMetrics = await metricsService.getAppMetrics();
    
    res.json({
      success: true,
      appMetrics
    });
  } catch (error) {
    console.error('Error getting app metrics:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get app metrics',
      error: error.message
    });
  }
});

/**
 * Get processing time percentiles
 * @route GET /api/metrics/processing-time
 */
router.get('/processing-time', async (req, res) => {
  try {
    const percentiles = await metricsService.getProcessingTimePercentiles();
    
    res.json({
      success: true,
      percentiles
    });
  } catch (error) {
    console.error('Error getting processing time:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get processing time',
      error: error.message
    });
  }
});

/**
 * Get current TPS
 * @route GET /api/metrics/tps
 */
router.get('/tps', async (req, res) => {
  try {
    const tps = await metricsService.getCurrentTPS();
    
    res.json({
      success: true,
      tps
    });
  } catch (error) {
    console.error('Error getting current TPS:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get current TPS',
      error: error.message
    });
  }
});

/**
 * Get cache statistics
 * @route GET /api/metrics/cache-stats
 */
router.get('/cache-stats', async (req, res) => {
  try {
    const stats = await metricsService.getCacheStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting cache stats:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics',
      error: error.message
    });
  }
});

/**
 * Clear metrics cache
 * @route POST /api/metrics/clear-cache
 */
router.post('/clear-cache', async (req, res) => {
  try {
    const result = await metricsService.clearCache();
    
    res.json({
      success: result,
      message: result ? 'Cache cleared successfully' : 'Failed to clear cache'
    });
  } catch (error) {
    console.error('Error clearing cache:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: error.message
    });
  }
});

// Prometheus optimizer routes (admin only)
router.use((req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  
  next();
});

/**
 * Get Prometheus health
 * @route GET /api/metrics/prometheus-health
 */
router.get('/prometheus-health', async (req, res) => {
  try {
    const health = await prometheusOptimizer.getHealth();
    
    res.json({
      success: true,
      health
    });
  } catch (error) {
    console.error('Error getting Prometheus health:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get Prometheus health',
      error: error.message
    });
  }
});

/**
 * Get Prometheus optimization recommendations
 * @route GET /api/metrics/optimization
 */
router.get('/optimization', async (req, res) => {
  try {
    const recommendations = await prometheusOptimizer.getOptimizationRecommendations();
    
    res.json({
      success: true,
      ...recommendations
    });
  } catch (error) {
    console.error('Error getting optimization recommendations:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get optimization recommendations',
      error: error.message
    });
  }
});

/**
 * Get slow queries
 * @route GET /api/metrics/slow-queries
 */
router.get('/slow-queries', async (req, res) => {
  try {
    const slowQueries = await prometheusOptimizer.analyzeSlowQueries();
    
    res.json({
      success: true,
      slowQueries
    });
  } catch (error) {
    console.error('Error analyzing slow queries:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to analyze slow queries',
      error: error.message
    });
  }
});

/**
 * Get cardinality metrics
 * @route GET /api/metrics/cardinality
 */
router.get('/cardinality', async (req, res) => {
  try {
    const cardinality = await prometheusOptimizer.getCardinalityMetrics();
    
    res.json({
      success: true,
      cardinality
    });
  } catch (error) {
    console.error('Error getting cardinality metrics:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get cardinality metrics',
      error: error.message
    });
  }
});

/**
 * Get TSDB stats
 * @route GET /api/metrics/tsdb-stats
 */
router.get('/tsdb-stats', async (req, res) => {
  try {
    const stats = await prometheusOptimizer.getTSDBStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting TSDB stats:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get TSDB stats',
      error: error.message
    });
  }
});

module.exports = router;