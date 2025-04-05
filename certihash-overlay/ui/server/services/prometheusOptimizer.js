const axios = require('axios');
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
  defaultMeta: { service: 'prometheus-optimizer' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/prometheus-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/prometheus-combined.log' })
  ]
});

// Prometheus URL
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://prometheus:9090';

/**
 * Service for optimizing Prometheus queries and storage
 */
const prometheusOptimizer = {
  /**
   * Get Prometheus metrics health
   * @returns {Promise<Object>} - Health status
   */
  async getHealth() {
    try {
      const response = await axios.get(`${PROMETHEUS_URL}/-/healthy`);
      return {
        status: response.status === 200 ? 'healthy' : 'unhealthy',
        statusCode: response.status
      };
    } catch (error) {
      logger.error(`Error checking Prometheus health: ${error.message}`, { 
        stack: error.stack 
      });
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  },
  
  /**
   * Get Prometheus runtime information
   * @returns {Promise<Object>} - Runtime info
   */
  async getRuntimeInfo() {
    try {
      const response = await axios.get(`${PROMETHEUS_URL}/api/v1/status/runtimeinfo`);
      return response.data.data;
    } catch (error) {
      logger.error(`Error getting Prometheus runtime info: ${error.message}`, { 
        stack: error.stack 
      });
      throw error;
    }
  },
  
  /**
   * Get Prometheus TSDB statistics
   * @returns {Promise<Object>} - TSDB stats
   */
  async getTSDBStats() {
    try {
      const response = await axios.get(`${PROMETHEUS_URL}/api/v1/status/tsdb`);
      return response.data.data;
    } catch (error) {
      logger.error(`Error getting Prometheus TSDB stats: ${error.message}`, { 
        stack: error.stack 
      });
      throw error;
    }
  },
  
  /**
   * Get Prometheus targets
   * @returns {Promise<Object>} - Targets info
   */
  async getTargets() {
    try {
      const response = await axios.get(`${PROMETHEUS_URL}/api/v1/targets`);
      return response.data.data;
    } catch (error) {
      logger.error(`Error getting Prometheus targets: ${error.message}`, { 
        stack: error.stack 
      });
      throw error;
    }
  },
  
  /**
   * Calculate Prometheus storage efficiency
   * @returns {Promise<Object>} - Storage efficiency metrics
   */
  async calculateStorageEfficiency() {
    try {
      const tsdbStats = await this.getTSDBStats();
      
      // Calculate metrics for storage efficiency
      const headChunksMetric = tsdbStats.headChunks || 0;
      const numSeries = tsdbStats.numSeries || 0;
      const numSamples = tsdbStats.numSamples || 0;
      
      // Bytes per sample
      const bytesPerSample = numSamples > 0 
        ? (tsdbStats.headStats?.numBytes || 0) / numSamples 
        : 0;
      
      // Samples per series
      const samplesPerSeries = numSeries > 0 
        ? numSamples / numSeries 
        : 0;
      
      // WAL size
      const walSize = tsdbStats.walStats?.totalBytes || 0;
      
      return {
        bytesPerSample,
        samplesPerSeries,
        headChunks: headChunksMetric,
        numSeries,
        numSamples,
        walSize,
        totalBytes: tsdbStats.headStats?.numBytes || 0
      };
    } catch (error) {
      logger.error(`Error calculating storage efficiency: ${error.message}`, { 
        stack: error.stack 
      });
      throw error;
    }
  },
  
  /**
   * Analyze slow queries
   * @returns {Promise<Array>} - Slow queries analysis
   */
  async analyzeSlowQueries() {
    try {
      // Get metrics about query execution time
      const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
        params: {
          query: 'sum by (query) (rate(prometheus_engine_query_duration_seconds_count[5m])) > 0'
        }
      });
      
      if (!response.data?.data?.result) {
        return [];
      }
      
      const queryCount = response.data.data.result;
      
      // Get query duration
      const durationResponse = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
        params: {
          query: 'sum by (query) (rate(prometheus_engine_query_duration_seconds_sum[5m])) / sum by (query) (rate(prometheus_engine_query_duration_seconds_count[5m]))'
        }
      });
      
      if (!durationResponse.data?.data?.result) {
        return queryCount.map(q => ({
          query: q.metric.query,
          count: parseFloat(q.value[1]),
          avgDuration: 0
        }));
      }
      
      const queryDuration = durationResponse.data.data.result;
      
      // Combine count and duration data
      const slowQueries = queryCount.map(countItem => {
        const query = countItem.metric.query;
        const count = parseFloat(countItem.value[1]);
        
        // Find matching duration item
        const durationItem = queryDuration.find(d => d.metric.query === query);
        const avgDuration = durationItem ? parseFloat(durationItem.value[1]) : 0;
        
        return {
          query,
          count,
          avgDuration
        };
      });
      
      // Sort by avg duration (slowest first)
      return slowQueries.sort((a, b) => b.avgDuration - a.avgDuration);
    } catch (error) {
      logger.error(`Error analyzing slow queries: ${error.message}`, { 
        stack: error.stack 
      });
      return [];
    }
  },
  
  /**
   * Get cardinality metrics
   * @returns {Promise<Object>} - Cardinality metrics
   */
  async getCardinalityMetrics() {
    try {
      const queries = [
        {
          name: 'totalSeries',
          query: 'prometheus_tsdb_head_series'
        },
        {
          name: 'seriesByMetricName',
          query: 'sort_desc(count by (__name__) ({__name__!=""}))'
        },
        {
          name: 'topCardinalityLabels',
          query: 'topk(10, count by (__name__, job) ({__name__!=""}))'
        }
      ];
      
      const results = {};
      
      for (const { name, query } of queries) {
        const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query`, {
          params: { query }
        });
        
        results[name] = response.data.data.result;
      }
      
      // Process results
      const totalSeries = results.totalSeries.length > 0 
        ? parseFloat(results.totalSeries[0].value[1]) 
        : 0;
      
      const seriesByMetricName = results.seriesByMetricName.map(item => ({
        metricName: item.metric.__name__,
        count: parseFloat(item.value[1])
      }));
      
      const topCardinalityLabels = results.topCardinalityLabels.map(item => ({
        metricName: item.metric.__name__,
        job: item.metric.job,
        count: parseFloat(item.value[1])
      }));
      
      return {
        totalSeries,
        seriesByMetricName,
        topCardinalityLabels
      };
    } catch (error) {
      logger.error(`Error getting cardinality metrics: ${error.message}`, { 
        stack: error.stack 
      });
      throw error;
    }
  },
  
  /**
   * Get storage optimization recommendations
   * @returns {Promise<Object>} - Optimization recommendations
   */
  async getOptimizationRecommendations() {
    try {
      const [efficiency, cardinality, slowQueries] = await Promise.all([
        this.calculateStorageEfficiency(),
        this.getCardinalityMetrics(),
        this.analyzeSlowQueries()
      ]);
      
      // Generate recommendations based on the metrics
      const recommendations = [];
      
      // Check for high cardinality
      if (cardinality.totalSeries > 1000000) {
        recommendations.push({
          type: 'cardinality',
          severity: 'high',
          message: 'High cardinality detected. Consider reducing the number of unique time series.',
          details: 'High cardinality can lead to excessive memory usage and slow query performance.',
          metrics: { totalSeries: cardinality.totalSeries }
        });
      } else if (cardinality.totalSeries > 500000) {
        recommendations.push({
          type: 'cardinality',
          severity: 'medium',
          message: 'Moderate cardinality detected. Monitor series growth.',
          details: 'Growing cardinality can eventually impact memory usage and query performance.',
          metrics: { totalSeries: cardinality.totalSeries }
        });
      }
      
      // Check for large WAL size
      if (efficiency.walSize > 500000000) { // 500MB
        recommendations.push({
          type: 'wal',
          severity: 'medium',
          message: 'Large Write-Ahead Log (WAL) size detected.',
          details: 'Consider adjusting WAL configuration or increasing compaction frequency.',
          metrics: { walSize: efficiency.walSize }
        });
      }
      
      // Check for slow queries
      const slowQueriesCount = slowQueries.filter(q => q.avgDuration > 1).length;
      if (slowQueriesCount > 0) {
        recommendations.push({
          type: 'query',
          severity: 'medium',
          message: `${slowQueriesCount} slow queries detected.`,
          details: 'Consider optimizing these queries or adding recording rules.',
          metrics: { slowQueries: slowQueries.slice(0, 5) }
        });
      }
      
      // Check for high bytes per sample
      if (efficiency.bytesPerSample > 5) {
        recommendations.push({
          type: 'storage',
          severity: 'low',
          message: 'High bytes per sample detected.',
          details: 'Consider adjusting compaction or retention settings.',
          metrics: { bytesPerSample: efficiency.bytesPerSample }
        });
      }
      
      return {
        efficiency,
        cardinality: {
          totalSeries: cardinality.totalSeries,
          topMetrics: cardinality.seriesByMetricName.slice(0, 10)
        },
        slowQueries: slowQueries.slice(0, 10),
        recommendations
      };
    } catch (error) {
      logger.error(`Error generating optimization recommendations: ${error.message}`, { 
        stack: error.stack 
      });
      return {
        error: 'Failed to generate optimization recommendations',
        recommendations: []
      };
    }
  }
};

module.exports = prometheusOptimizer;