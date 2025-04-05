const { createLogger, format, transports } = require('winston');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

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
  defaultMeta: { service: 'mcp-grafana' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/mcp-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/mcp-combined.log' })
  ]
});

// MCP Grafana URL
const MCP_GRAFANA_URL = process.env.MCP_GRAFANA_URL || 'http://mcp-grafana:8000';

/**
 * Service for interacting with MCP-Grafana
 */
const mcpGrafanaService = {
  /**
   * Execute MCP Grafana request
   * @param {string} toolName - Name of the MCP tool to use
   * @param {Object} params - Tool parameters
   * @returns {Promise<Object>} - Tool response
   */
  async executeRequest(toolName, params) {
    try {
      // Create request ID
      const requestId = uuidv4();
      
      // Prepare request
      const request = {
        id: requestId,
        tool: toolName,
        params: params
      };
      
      // Send request to MCP Grafana
      const response = await axios.post(`${MCP_GRAFANA_URL}/v1/execute`, request);
      
      logger.info(`Executed MCP Grafana tool: ${toolName}`, { requestId });
      return response.data;
    } catch (error) {
      logger.error(`Error executing MCP Grafana tool: ${error.message}`, { 
        stack: error.stack,
        toolName
      });
      throw error;
    }
  },
  
  /**
   * Search dashboards
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Dashboard list
   */
  async searchDashboards(query) {
    try {
      const result = await this.executeRequest('search_dashboards', {
        query: query
      });
      
      return result.dashboards || [];
    } catch (error) {
      logger.error(`Error searching dashboards: ${error.message}`, { 
        stack: error.stack,
        query
      });
      return [];
    }
  },
  
  /**
   * Get dashboard by UID
   * @param {string} uid - Dashboard UID
   * @returns {Promise<Object>} - Dashboard data
   */
  async getDashboard(uid) {
    try {
      const result = await this.executeRequest('get_dashboard_by_uid', {
        uid: uid
      });
      
      return result.dashboard || null;
    } catch (error) {
      logger.error(`Error getting dashboard: ${error.message}`, { 
        stack: error.stack,
        uid
      });
      return null;
    }
  },
  
  /**
   * List datasources
   * @returns {Promise<Array>} - Datasource list
   */
  async listDatasources() {
    try {
      const result = await this.executeRequest('list_datasources', {});
      
      return result.datasources || [];
    } catch (error) {
      logger.error(`Error listing datasources: ${error.message}`, { 
        stack: error.stack
      });
      return [];
    }
  },
  
  /**
   * Query Prometheus
   * @param {string} query - Prometheus query
   * @param {string} datasource - Datasource name or UID
   * @param {number} start - Start time (Unix timestamp in seconds)
   * @param {number} end - End time (Unix timestamp in seconds)
   * @returns {Promise<Object>} - Query result
   */
  async queryPrometheus(query, datasource, start, end) {
    try {
      const params = { query: query };
      
      if (datasource) {
        // Check if datasource is UID or name
        if (datasource.includes('-')) {
          params.datasourceUid = datasource;
        } else {
          params.datasourceName = datasource;
        }
      }
      
      if (start && end) {
        params.start = start;
        params.end = end;
      }
      
      const result = await this.executeRequest('query_prometheus', params);
      
      return result.data || null;
    } catch (error) {
      logger.error(`Error querying Prometheus: ${error.message}`, { 
        stack: error.stack,
        query
      });
      return null;
    }
  },
  
  /**
   * List Prometheus metric names
   * @param {string} datasource - Datasource name or UID
   * @returns {Promise<Array>} - Metric names
   */
  async listPrometheusMetricNames(datasource) {
    try {
      const params = {};
      
      if (datasource) {
        // Check if datasource is UID or name
        if (datasource.includes('-')) {
          params.datasourceUid = datasource;
        } else {
          params.datasourceName = datasource;
        }
      }
      
      const result = await this.executeRequest('list_prometheus_metric_names', params);
      
      return result.metricNames || [];
    } catch (error) {
      logger.error(`Error listing Prometheus metric names: ${error.message}`, { 
        stack: error.stack
      });
      return [];
    }
  },
  
  /**
   * List Prometheus label names
   * @param {string} selector - Metric selector
   * @param {string} datasource - Datasource name or UID
   * @returns {Promise<Array>} - Label names
   */
  async listPrometheusLabelNames(selector, datasource) {
    try {
      const params = {};
      
      if (selector) {
        params.selector = selector;
      }
      
      if (datasource) {
        // Check if datasource is UID or name
        if (datasource.includes('-')) {
          params.datasourceUid = datasource;
        } else {
          params.datasourceName = datasource;
        }
      }
      
      const result = await this.executeRequest('list_prometheus_label_names', params);
      
      return result.labelNames || [];
    } catch (error) {
      logger.error(`Error listing Prometheus label names: ${error.message}`, { 
        stack: error.stack,
        selector
      });
      return [];
    }
  },
  
  /**
   * List Prometheus label values
   * @param {string} label - Label name
   * @param {string} selector - Metric selector
   * @param {string} datasource - Datasource name or UID
   * @returns {Promise<Array>} - Label values
   */
  async listPrometheusLabelValues(label, selector, datasource) {
    try {
      const params = { label: label };
      
      if (selector) {
        params.selector = selector;
      }
      
      if (datasource) {
        // Check if datasource is UID or name
        if (datasource.includes('-')) {
          params.datasourceUid = datasource;
        } else {
          params.datasourceName = datasource;
        }
      }
      
      const result = await this.executeRequest('list_prometheus_label_values', params);
      
      return result.labelValues || [];
    } catch (error) {
      logger.error(`Error listing Prometheus label values: ${error.message}`, { 
        stack: error.stack,
        label,
        selector
      });
      return [];
    }
  },
  
  /**
   * List alert rules
   * @returns {Promise<Array>} - Alert rules
   */
  async listAlertRules() {
    try {
      const result = await this.executeRequest('list_alert_rules', {});
      
      return result.rules || [];
    } catch (error) {
      logger.error(`Error listing alert rules: ${error.message}`, { 
        stack: error.stack
      });
      return [];
    }
  },
  
  /**
   * Query Loki logs
   * @param {string} query - LogQL query
   * @param {string} datasource - Datasource name or UID
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise<Array>} - Log entries
   */
  async queryLokiLogs(query, datasource, limit = 100) {
    try {
      const params = { 
        query: query,
        limit: limit
      };
      
      if (datasource) {
        // Check if datasource is UID or name
        if (datasource.includes('-')) {
          params.datasourceUid = datasource;
        } else {
          params.datasourceName = datasource;
        }
      }
      
      const result = await this.executeRequest('query_loki_logs', params);
      
      return result.logs || [];
    } catch (error) {
      logger.error(`Error querying Loki logs: ${error.message}`, { 
        stack: error.stack,
        query
      });
      return [];
    }
  }
};

module.exports = mcpGrafanaService;