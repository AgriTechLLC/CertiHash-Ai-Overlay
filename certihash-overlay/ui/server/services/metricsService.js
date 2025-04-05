const axios = require('axios');
const cacheService = require('./cacheService');
const { createLogger, format, transports } = require('winston');

// Configure logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'metrics-service' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/metrics-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/metrics-combined.log' })
  ]
});

// Prometheus URL
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://prometheus:9090';

/**
 * Service for fetching and caching metrics
 */
const metricsService = {
  /**
   * Get metrics from Prometheus with caching
   * @param {string} query - Prometheus query
   * @param {Object} timeRange - Time range object { start, end }
   * @param {number} cacheTime - Cache TTL in seconds (default: 60 seconds)
   * @returns {Promise<Object>} - Query result
   */
  async getMetrics(query, timeRange = {}, cacheTime = 60) {
    const cacheKey = `metrics:${query}:${JSON.stringify(timeRange)}`;
    
    try {
      // Try to get from cache first
      const cachedData = await cacheService.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // Build parameters for Prometheus query
      const params = { query };
      
      // Add time range if provided
      if (timeRange.start) {
        params.start = timeRange.start;
      }
      if (timeRange.end) {
        params.end = timeRange.end;
      }
      
      // If time range is provided, use query_range endpoint
      const endpoint = (timeRange.start && timeRange.end) ? '/api/v1/query_range' : '/api/v1/query';
      
      // Fetch from Prometheus
      const response = await axios.get(`${PROMETHEUS_URL}${endpoint}`, { params });
      
      // Cache the result
      const result = response.data;
      await cacheService.set(cacheKey, result, cacheTime);
      
      return result;
    } catch (error) {
      logger.error(`Error fetching metrics: ${error.message}`, { 
        stack: error.stack,
        query,
        timeRange
      });
      throw error;
    }
  },
  
  /**
   * Get multiple metrics in parallel
   * @param {Array<Object>} queries - Array of query objects { name, query, timeRange, cacheTime }
   * @returns {Promise<Object>} - Object with results keyed by name
   */
  async getMultipleMetrics(queries) {
    try {
      const results = {};
      const promises = queries.map(async ({ name, query, timeRange, cacheTime }) => {
        const result = await this.getMetrics(query, timeRange, cacheTime);
        results[name] = result;
      });
      
      await Promise.all(promises);
      return results;
    } catch (error) {
      logger.error(`Error fetching multiple metrics: ${error.message}`, { 
        stack: error.stack,
        queries: queries.map(q => q.name)
      });
      throw error;
    }
  },
  
  /**
   * Get transaction volume metrics
   * @param {string} period - Time period ('1h', '1d', '7d', '30d', etc.)
   * @returns {Promise<Object>} - Transaction volume data
   */
  async getTransactionVolume(period = '1d') {
    // Calculate time range based on period
    const end = Math.floor(Date.now() / 1000);
    let start;
    let step;
    
    switch (period) {
      case '1h':
        start = end - 3600;
        step = '60s';
        break;
      case '1d':
        start = end - 86400;
        step = '5m';
        break;
      case '7d':
        start = end - 604800;
        step = '1h';
        break;
      case '30d':
        start = end - 2592000;
        step = '6h';
        break;
      default:
        start = end - 86400; // Default to 1 day
        step = '5m';
    }
    
    const timeRange = { start, end, step };
    
    try {
      // Cache for longer periods is more aggressive
      const cacheTime = period === '1h' ? 60 : period === '1d' ? 300 : 1800;
      
      // Get transaction rate over time
      const result = await this.getMetrics(
        'rate(certihash_transactions_total[5m])',
        timeRange,
        cacheTime
      );
      
      return result;
    } catch (error) {
      logger.error(`Error getting transaction volume: ${error.message}`, { 
        stack: error.stack,
        period
      });
      throw error;
    }
  },
  
  /**
   * Get current TPS (Transactions Per Second)
   * @returns {Promise<number>} - Current TPS
   */
  async getCurrentTPS() {
    try {
      const result = await this.getMetrics('certihash_tps', {}, 15); // Cache for 15 seconds
      
      if (result.data?.result && result.data.result.length > 0) {
        const value = parseFloat(result.data.result[0].value[1]);
        return value;
      }
      
      return 0;
    } catch (error) {
      logger.error(`Error getting current TPS: ${error.message}`, { 
        stack: error.stack
      });
      throw error;
    }
  },
  
  /**
   * Get transaction metrics by application
   * @returns {Promise<Array>} - App metrics
   */
  async getAppMetrics() {
    try {
      const result = await this.getMetrics(
        'sum by(app_id) (certihash_transactions_total)',
        {},
        300 // Cache for 5 minutes
      );
      
      if (result.data?.result) {
        return result.data.result.map(item => ({
          appId: item.metric.app_id,
          transactions: parseFloat(item.value[1]),
        }));
      }
      
      return [];
    } catch (error) {
      logger.error(`Error getting app metrics: ${error.message}`, { 
        stack: error.stack
      });
      throw error;
    }
  },
  
  /**
   * Get processing time percentiles
   * @returns {Promise<Object>} - Processing time percentiles
   */
  async getProcessingTimePercentiles() {
    try {
      const queries = [
        { 
          name: 'median', 
          query: 'histogram_quantile(0.5, sum(rate(certihash_tx_processing_time_bucket[5m])) by (le))',
          cacheTime: 60
        },
        { 
          name: 'p95', 
          query: 'histogram_quantile(0.95, sum(rate(certihash_tx_processing_time_bucket[5m])) by (le))',
          cacheTime: 60 
        },
        { 
          name: 'p99', 
          query: 'histogram_quantile(0.99, sum(rate(certihash_tx_processing_time_bucket[5m])) by (le))',
          cacheTime: 60
        }
      ];
      
      const results = await this.getMultipleMetrics(queries);
      
      const percentiles = {};
      
      for (const [name, result] of Object.entries(results)) {
        if (result.data?.result && result.data.result.length > 0) {
          percentiles[name] = parseFloat(result.data.result[0].value[1]);
        } else {
          percentiles[name] = null;
        }
      }
      
      return percentiles;
    } catch (error) {
      logger.error(`Error getting processing time percentiles: ${error.message}`, { 
        stack: error.stack
      });
      throw error;
    }
  },
  
  /**
   * Get dashboard metrics for home page
   * @returns {Promise<Object>} - Dashboard metrics
   */
  async getDashboardMetrics() {
    try {
      const queries = [
        { 
          name: 'totalTransactions', 
          query: 'certihash_transactions_total',
          cacheTime: 300
        },
        { 
          name: 'currentTPS', 
          query: 'certihash_tps',
          cacheTime: 15
        },
        { 
          name: 'processingTime', 
          query: 'histogram_quantile(0.95, sum(rate(certihash_tx_processing_time_bucket[5m])) by (le))',
          cacheTime: 60
        }
      ];
      
      const results = await this.getMultipleMetrics(queries);
      
      const metrics = {
        totalTransactions: 0,
        currentTPS: 0,
        processingTime: 0
      };
      
      // Parse total transactions
      if (results.totalTransactions?.data?.result && results.totalTransactions.data.result.length > 0) {
        metrics.totalTransactions = parseFloat(results.totalTransactions.data.result[0].value[1]);
      }
      
      // Parse current TPS
      if (results.currentTPS?.data?.result && results.currentTPS.data.result.length > 0) {
        metrics.currentTPS = parseFloat(results.currentTPS.data.result[0].value[1]);
      }
      
      // Parse processing time
      if (results.processingTime?.data?.result && results.processingTime.data.result.length > 0) {
        metrics.processingTime = parseFloat(results.processingTime.data.result[0].value[1]);
      }
      
      return metrics;
    } catch (error) {
      logger.error(`Error getting dashboard metrics: ${error.message}`, { 
        stack: error.stack
      });
      throw error;
    }
  },
  
  /**
   * Clear metrics cache
   * @returns {Promise<boolean>} - Success status
   */
  async clearCache() {
    return await cacheService.clear();
  },
  
  /**
   * Get cache stats
   * @returns {Promise<Object>} - Cache statistics
   */
  async getCacheStats() {
    return await cacheService.getStats();
  }
};

module.exports = metricsService;