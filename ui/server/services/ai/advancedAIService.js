const { createLogger, format, transports } = require('winston');
const axios = require('axios');
const vectorStore = require('./vectorStore');
const mcpGrafana = require('./mcpGrafana');

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
  defaultMeta: { service: 'advanced-ai' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/ai-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/ai-combined.log' })
  ]
});

// LiteLLM URL
const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm:4000';
const LITELLM_API_KEY = process.env.LITELLM_API_KEY;

/**
 * Advanced AI service combining LiteLLM, vector storage, and MCP-Grafana
 */
const advancedAIService = {
  /**
   * Initialize the service
   * @returns {Promise<boolean>} - Success status
   */
  async initialize() {
    try {
      // Initialize vector store
      const vectorInitialized = await vectorStore.initialize();
      if (!vectorInitialized) {
        logger.error('Failed to initialize vector store');
        return false;
      }
      
      // Seed knowledge if needed
      const stats = await vectorStore.getStats();
      if (!stats.error && stats.totalDocuments < 10) {
        await vectorStore.seedKnowledge();
      }
      
      logger.info('Advanced AI service initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing advanced AI service: ${error.message}`, { 
        stack: error.stack 
      });
      return false;
    }
  },
  
  /**
   * Call LiteLLM with a specific model
   * @param {string} model - Model name
   * @param {Array} messages - Chat messages
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - LLM response
   */
  async callLiteLLM(model, messages, options = {}) {
    try {
      const response = await axios.post(
        `${LITELLM_URL}/v1/chat/completions`,
        {
          model: model,
          messages: messages,
          temperature: options.temperature || 0.3,
          max_tokens: options.max_tokens,
          response_format: options.response_format
        },
        {
          headers: {
            'Authorization': `Bearer ${LITELLM_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      logger.error(`Error calling LiteLLM: ${error.message}`, { 
        stack: error.stack,
        model,
        messages: messages.map(m => ({ role: m.role, content_length: m.content?.length || 0 }))
      });
      throw error;
    }
  },
  
  /**
   * Detect anomalies in transaction data
   * @param {Object} data - Transaction data
   * @param {boolean} explain - Whether to provide explanation
   * @returns {Promise<Object>} - Anomaly detection result
   */
  async detectAnomalies(data, explain = false) {
    try {
      // Format data for LLM
      const formattedData = JSON.stringify(data);
      
      // Create messages array
      const messages = [
        {
          role: 'user',
          content: `Analyze this CERTIHASH transaction data for anomalies: ${formattedData}`
        }
      ];
      
      // Call anomaly detection model
      const response = await this.callLiteLLM('anomaly-detection', messages, {
        temperature: 0.1,
        response_format: { type: "json_object" }
      });
      
      // Extract anomaly detection result
      const anomalyResult = JSON.parse(response.choices[0].message.content);
      
      // If explanation is requested, get explanation for detected anomalies
      if (explain && anomalyResult.anomalies?.length > 0) {
        await this.explainAnomalies(anomalyResult);
      }
      
      return anomalyResult;
    } catch (error) {
      logger.error(`Error detecting anomalies: ${error.message}`, { 
        stack: error.stack
      });
      return {
        success: false,
        error: 'Failed to detect anomalies',
        message: error.message
      };
    }
  },
  
  /**
   * Predict future transaction patterns
   * @param {Array} historicalData - Historical transaction data
   * @param {number} forecastDays - Days to forecast
   * @returns {Promise<Object>} - Prediction result
   */
  async predictTransactions(historicalData, forecastDays = 7) {
    try {
      // Format data for LLM
      const formattedData = JSON.stringify(historicalData);
      
      // Create messages array
      const messages = [
        {
          role: 'user',
          content: `Based on this historical CERTIHASH transaction data: ${formattedData}, forecast the daily transaction volumes for the next ${forecastDays} days. Return the forecast as a JSON array of objects with date and transactions properties. Also include confidence intervals (low, high) for each prediction and an overall growth trend analysis.`
        }
      ];
      
      // Call predictive analytics model
      const response = await this.callLiteLLM('predictive-analytics', messages, {
        temperature: 0.2,
        response_format: { type: "json_object" }
      });
      
      // Extract prediction result
      const predictionResult = JSON.parse(response.choices[0].message.content);
      
      return predictionResult;
    } catch (error) {
      logger.error(`Error predicting transactions: ${error.message}`, { 
        stack: error.stack
      });
      return {
        success: false,
        error: 'Failed to predict transactions',
        message: error.message
      };
    }
  },
  
  /**
   * Generate Grafana dashboard configuration
   * @param {string} dashboardName - Dashboard name
   * @param {string} description - Dashboard description
   * @param {Array} panels - Panel specifications
   * @returns {Promise<Object>} - Dashboard configuration
   */
  async generateDashboard(dashboardName, description, panels) {
    try {
      // Format panels for LLM
      const formattedPanels = JSON.stringify(panels);
      
      // Create messages array
      const messages = [
        {
          role: 'user',
          content: `Generate a Grafana dashboard configuration in JSON format with the following specifications:
Dashboard Name: ${dashboardName}
Description: ${description}
Panels: ${formattedPanels}

Return the complete dashboard JSON configuration.`
        }
      ];
      
      // Call dashboard generator model
      const response = await this.callLiteLLM('dashboard-generator', messages, {
        temperature: 0.2,
        max_tokens: 4000
      });
      
      // Extract dashboard configuration
      const dashboardText = response.choices[0].message.content;
      
      // Extract JSON from the response (handle markdown code blocks)
      let dashboardJson;
      try {
        // Check if response is wrapped in markdown code blocks
        if (dashboardText.includes('```json')) {
          const jsonMatch = dashboardText.match(/```json\n([\s\S]*?)```/);
          if (jsonMatch && jsonMatch[1]) {
            dashboardJson = JSON.parse(jsonMatch[1]);
          } else {
            dashboardJson = JSON.parse(dashboardText);
          }
        } else {
          dashboardJson = JSON.parse(dashboardText);
        }
      } catch (err) {
        logger.error(`Error parsing dashboard JSON: ${err.message}`);
        throw new Error('Failed to parse dashboard JSON configuration');
      }
      
      return dashboardJson;
    } catch (error) {
      logger.error(`Error generating dashboard: ${error.message}`, { 
        stack: error.stack,
        dashboardName
      });
      return {
        success: false,
        error: 'Failed to generate dashboard',
        message: error.message
      };
    }
  },
  
  /**
   * Explain anomalies in human-readable format
   * @param {Object} anomalyResult - Anomaly detection result
   * @returns {Promise<Object>} - Enhanced anomaly result with explanations
   */
  async explainAnomalies(anomalyResult) {
    try {
      // Format anomalies for LLM
      const formattedAnomalies = JSON.stringify(anomalyResult.anomalies);
      
      // Create messages array
      const messages = [
        {
          role: 'user',
          content: `Explain these detected blockchain transaction anomalies in simple, easy-to-understand language: ${formattedAnomalies}

For each anomaly, provide:
1. A simple explanation of what happened
2. Why this might be significant
3. Potential causes
4. Recommended actions

Your response should be accessible to non-technical users while still being accurate.`
        }
      ];
      
      // Call explainable AI model
      const response = await this.callLiteLLM('explainable-ai', messages);
      
      // Add explanations to original anomaly result
      anomalyResult.explanations = response.choices[0].message.content;
      
      return anomalyResult;
    } catch (error) {
      logger.error(`Error explaining anomalies: ${error.message}`, { 
        stack: error.stack
      });
      
      // Return original result without explanations
      return anomalyResult;
    }
  },
  
  /**
   * Process natural language query with domain-specific knowledge
   * @param {string} query - User query
   * @returns {Promise<Object>} - Query response
   */
  async processQuery(query) {
    try {
      // Search vector store for relevant knowledge
      const similarDocs = await vectorStore.searchSimilar(query, 3);
      
      // Format context from vector store
      const context = similarDocs.length > 0
        ? `Relevant context:\n${similarDocs.map(doc => `- ${doc.text}`).join('\n\n')}`
        : '';
      
      // Determine if query is about metrics/dashboards
      const isDashboardQuery = query.toLowerCase().includes('dashboard') ||
                               query.toLowerCase().includes('grafana') ||
                               query.toLowerCase().includes('visualization') ||
                               query.toLowerCase().includes('chart');
                                 
      const isMetricsQuery = query.toLowerCase().includes('metrics') ||
                             query.toLowerCase().includes('prometheus') ||
                             query.toLowerCase().includes('transaction') ||
                             query.toLowerCase().includes('volume') ||
                             query.toLowerCase().includes('tps');
      
      // If query is about dashboards, fetch dashboard information
      let dashboardInfo = '';
      if (isDashboardQuery) {
        const dashboards = await mcpGrafana.searchDashboards('certihash');
        if (dashboards.length > 0) {
          dashboardInfo = `Available dashboards:\n${dashboards.map(d => `- ${d.title}: ${d.url}`).join('\n')}`;
        }
      }
      
      // If query is about metrics, fetch available metrics
      let metricsInfo = '';
      if (isMetricsQuery) {
        const metricNames = await mcpGrafana.listPrometheusMetricNames();
        const relevantMetrics = metricNames.filter(m => m.includes('certihash'));
        if (relevantMetrics.length > 0) {
          metricsInfo = `Available metrics:\n${relevantMetrics.join('\n')}`;
        }
      }
      
      // Combine all context
      const fullContext = [context, dashboardInfo, metricsInfo]
        .filter(Boolean)
        .join('\n\n');
      
      // Create messages array
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant specializing in BSV blockchain and CERTIHASH metrics. Answer user questions about blockchain transactions, monitoring, and analytics.

If the query requests data visualization or dashboard creation, suggest using the CERTIHASH dashboards.
If the query is about anomaly detection or predictions, mention the AI capabilities available.
If the query requests specific metrics or data, refer to the available Prometheus metrics.`
        }
      ];
      
      // Add context if available
      if (fullContext) {
        messages.push({
          role: 'system',
          content: fullContext
        });
      }
      
      // Add user query
      messages.push({
        role: 'user',
        content: query
      });
      
      // Call vector-augmented model
      const response = await this.callLiteLLM('vector-augmented', messages);
      
      // Extract response
      const answer = response.choices[0].message.content;
      
      // If the query is about dashboards or metrics, check if we can execute a Prometheus query
      let prometheusData = null;
      if (isMetricsQuery) {
        // Generate Prometheus query from natural language
        const queryGenMessages = [
          {
            role: 'system',
            content: 'Convert natural language queries about CERTIHASH metrics into Prometheus PromQL queries. Available metrics include: certihash_transactions_total, certihash_tps, certihash_tx_processing_time.'
          },
          {
            role: 'user',
            content: `Generate a Prometheus query for: ${query}`
          }
        ];
        
        const queryGenResponse = await this.callLiteLLM('gpt-4o', queryGenMessages, {
          temperature: 0.1
        });
        
        const prometheusQuery = queryGenResponse.choices[0].message.content.trim();
        
        // Execute Prometheus query if it looks valid
        if (prometheusQuery.includes('certihash_')) {
          try {
            prometheusData = await mcpGrafana.queryPrometheus(prometheusQuery);
          } catch (err) {
            logger.warn(`Error executing Prometheus query: ${err.message}`);
          }
        }
      }
      
      return {
        answer,
        relatedDocuments: similarDocs,
        prometheusData
      };
    } catch (error) {
      logger.error(`Error processing query: ${error.message}`, { 
        stack: error.stack,
        query
      });
      return {
        success: false,
        error: 'Failed to process query',
        message: error.message
      };
    }
  },
  
  /**
   * Process NLP query for the AI Assistant with MCP-Grafana integration
   * @param {string} query - User query
   * @returns {Promise<Object>} - NLP query response with Grafana integration
   */
  async processNLPQuery(query) {
    try {
      // Search vector store for relevant knowledge
      const similarDocs = await vectorStore.searchSimilar(query, 3);
      
      // Format context from vector store
      const context = similarDocs.length > 0
        ? `Relevant context:\n${similarDocs.map(doc => `- ${doc.text} (Source: ${doc.source})`).join('\n\n')}`
        : '';
      
      // Check if we should use MCP-Grafana capabilities
      const isVisualizationQuery = query.toLowerCase().includes('show me') ||
                                   query.toLowerCase().includes('visualize') ||
                                   query.toLowerCase().includes('display') ||
                                   query.toLowerCase().includes('graph') ||
                                   query.toLowerCase().includes('chart') ||
                                   query.toLowerCase().includes('plot') ||
                                   query.toLowerCase().includes('dashboard');
      
      // Use MCP-Grafana for visualization queries
      let grafanaUrl = null;
      let mcpResponse = null;
      
      if (isVisualizationQuery) {
        try {
          const mcpQueryResult = await mcpGrafana.executeNLQuery(query);
          if (mcpQueryResult && mcpQueryResult.dashboard_url) {
            grafanaUrl = mcpQueryResult.dashboard_url;
            mcpResponse = mcpQueryResult.explanation || "I've created a visualization based on your query.";
          }
        } catch (err) {
          logger.warn(`Error executing MCP query: ${err.message}`);
        }
      }
      
      // Create messages array with system context
      const messages = [
        {
          role: 'system',
          content: `You are an AI assistant for CERTIHASH, a blockchain cybersecurity platform. Answer user questions about BSV blockchain transactions, metrics, and analytics. Format your responses in HTML for better readability.
          
When appropriate, include:
- Bold headers using <strong> tags
- Bullet points using <ul> and <li> tags
- Italics for emphasis using <em> tags
- Simple tables using <table>, <tr>, and <td> tags when presenting structured data

${context}

${mcpResponse ? `A visualization has been created in Grafana: ${mcpResponse}` : ''}`
        },
        {
          role: 'user',
          content: query
        }
      ];
      
      // Call the most appropriate model based on query
      const modelToUse = isVisualizationQuery ? 'dashboard-generator' : 'vector-augmented';
      const response = await this.callLiteLLM(modelToUse, messages);
      
      // Format the response
      const answer = response.choices[0].message.content;
      
      return {
        answer,
        sources: similarDocs.map(doc => doc.source),
        grafanaUrl
      };
    } catch (error) {
      logger.error(`Error processing NLP query: ${error.message}`, { 
        stack: error.stack,
        query
      });
      throw error;
    }
  },

  /**
   * Get recent anomalies for the AI Assistant
   * @param {string} timeRange - Time range to fetch anomalies for
   * @returns {Promise<Array>} - List of anomalies
   */
  async getRecentAnomalies(timeRange) {
    try {
      // In a real implementation, this would query the database or Prometheus
      // For demo purposes, we'll generate mock anomalies with the LLM
      
      const messages = [
        {
          role: 'system',
          content: `Generate a list of 5-10 realistic blockchain transaction anomalies for a CERTIHASH dashboard. 
Each anomaly should include:
- id: a unique identifier
- title: a short descriptive title
- description: a brief description of the anomaly
- severity: one of "critical", "high", "medium", or "low"
- timestamp: a timestamp within the last ${timeRange}
- detailedAnalysis: a longer HTML-formatted analysis with technical details
- recommendation: HTML-formatted recommended actions
- metrics: an array of affected metrics
- tags: an array of relevant tags
- grafanaUrl: a mock URL to a Grafana dashboard

Format the response as a JSON array.`
        }
      ];
      
      const response = await this.callLiteLLM('anomaly-detection', messages, {
        temperature: 0.7,
        response_format: { type: "json_object" }
      });
      
      // Parse and return the anomalies
      const anomalies = JSON.parse(response.choices[0].message.content);
      return Array.isArray(anomalies) ? anomalies : [];
    } catch (error) {
      logger.error(`Error getting recent anomalies: ${error.message}`, { 
        stack: error.stack,
        timeRange
      });
      return [];
    }
  },

  /**
   * Generate predictive analytics for the AI Assistant
   * @param {string} metricType - Type of metric to predict
   * @param {string} timeWindow - Historical time window
   * @param {string} predictionHorizon - Prediction horizon
   * @returns {Promise<Object>} - Predictive analytics result
   */
  async generatePredictiveAnalytics(metricType, timeWindow, predictionHorizon) {
    try {
      // In a real implementation, this would query historical data from Prometheus
      // and use a trained model for predictions
      // For demo purposes, we'll generate mock predictions with the LLM
      
      const messages = [
        {
          role: 'system',
          content: `Generate realistic predictive analytics for CERTIHASH blockchain ${metricType} based on a ${timeWindow} historical window with a ${predictionHorizon} prediction horizon.

The response should be a JSON object with:
- summary: HTML-formatted summary of the prediction
- analysis: longer HTML-formatted detailed analysis
- currentValue: current metric value (numeric)
- predictedValue: predicted metric value (numeric)
- unit: measurement unit
- trend: "up", "down", or "stable"
- factors: array of contributing factors
- tags: array of relevant tags
- grafanaUrl: a mock URL to a Grafana dashboard

The values should be realistic for a blockchain platform.`
        }
      ];
      
      const response = await this.callLiteLLM('predictive-analytics', messages, {
        temperature: 0.5,
        response_format: { type: "json_object" }
      });
      
      // Parse and return the prediction
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error(`Error generating predictive analytics: ${error.message}`, { 
        stack: error.stack,
        metricType,
        timeWindow,
        predictionHorizon
      });
      throw error;
    }
  },

  /**
   * Generate dashboard suggestions based on description
   * @param {string} description - Dashboard description
   * @returns {Promise<Object>} - Dashboard suggestions
   */
  async generateDashboardSuggestions(description) {
    try {
      const messages = [
        {
          role: 'system',
          content: `Generate dashboard suggestions for a CERTIHASH blockchain monitoring dashboard based on this description: "${description}"

The response should be a JSON object with:
- title: suggested dashboard title
- type: suggested dashboard type (transactions, performance, security, etc.)
- suggestedMetrics: array of 5-10 metrics that would be useful
- preview: a simple description of what the dashboard would look like

Focus on blockchain and transaction monitoring metrics appropriate for the CERTIHASH platform.`
        }
      ];
      
      const response = await this.callLiteLLM('dashboard-generator', messages, {
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      
      // Parse and return the suggestions
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error(`Error generating dashboard suggestions: ${error.message}`, { 
        stack: error.stack,
        description
      });
      throw error;
    }
  },

  /**
   * Generate dashboard preview based on configuration
   * @param {string} title - Dashboard title
   * @param {string} type - Dashboard type
   * @param {Array} metrics - Selected metrics
   * @param {string} timeRange - Default time range
   * @param {string} refreshInterval - Refresh interval
   * @returns {Promise<Object>} - Dashboard preview
   */
  async generateDashboardPreview(title, type, metrics, timeRange, refreshInterval) {
    try {
      const messages = [
        {
          role: 'system',
          content: `Generate a preview for a CERTIHASH blockchain monitoring dashboard with these specifications:
- Title: ${title}
- Type: ${type}
- Metrics: ${metrics.join(', ')}
- Time Range: ${timeRange}
- Refresh Interval: ${refreshInterval}

The response should be a JSON object with:
- title: the dashboard title
- type: dashboard type
- description: a short description of the dashboard
- panels: array of panel objects, each containing a title and description
- aiInsight: AI-generated insight about this dashboard configuration

The panels should represent a logical layout for visualizing the selected metrics.`
        }
      ];
      
      const response = await this.callLiteLLM('dashboard-generator', messages, {
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      
      // Parse and return the preview
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      logger.error(`Error generating dashboard preview: ${error.message}`, { 
        stack: error.stack,
        title,
        type,
        metrics
      });
      throw error;
    }
  },

  /**
   * Create dashboard in Grafana via MCP-Grafana
   * @param {string} title - Dashboard title
   * @param {string} type - Dashboard type
   * @param {Array} metrics - Selected metrics
   * @param {string} timeRange - Default time range
   * @param {string} refreshInterval - Refresh interval
   * @returns {Promise<Object>} - Created dashboard info
   */
  async createDashboard(title, type, metrics, timeRange, refreshInterval) {
    try {
      // In a real implementation, this would create a dashboard in Grafana
      // via MCP-Grafana API. For demo purposes, we'll simulate creation
      
      // First, generate a dashboard configuration
      const dashboardConfig = await this.generateDashboard(
        title,
        `Create a ${type} dashboard for CERTIHASH with metrics: ${metrics.join(', ')}. Use ${timeRange} as default time range and ${refreshInterval} refresh interval.`,
        metrics.map(metric => ({ name: metric, type: 'graph' }))
      );
      
      // In a real implementation, this would use MCP-Grafana to create the dashboard
      // For demo purposes, we'll return a mock result
      
      return {
        title: title,
        url: '/grafana/d/abc123/my-generated-dashboard',
        id: 'mock-dashboard-id-123',
        success: true
      };
    } catch (error) {
      logger.error(`Error creating dashboard: ${error.message}`, { 
        stack: error.stack,
        title,
        type,
        metrics
      });
      throw error;
    }
  },

  /**
   * Get AI capabilities and statistics
   * @returns {Promise<Object>} - AI system stats
   */
  async getAIStats() {
    try {
      // Get vector store stats
      const vectorStats = await vectorStore.getStats();
      
      // Get LiteLLM model list
      let modelList = [];
      try {
        const response = await axios.get(`${LITELLM_URL}/v1/models`, {
          headers: {
            'Authorization': `Bearer ${LITELLM_API_KEY}`
          }
        });
        
        modelList = response.data.data || [];
      } catch (err) {
        logger.warn(`Error fetching model list: ${err.message}`);
      }
      
      // Get MCP Grafana info
      let mcpStats = {};
      try {
        const dashboards = await mcpGrafana.searchDashboards('');
        const datasources = await mcpGrafana.listDatasources();
        
        mcpStats = {
          dashboardCount: dashboards.length,
          datasourceCount: datasources.length
        };
      } catch (err) {
        logger.warn(`Error fetching MCP stats: ${err.message}`);
      }
      
      return {
        vector: vectorStats,
        models: modelList.map(m => ({
          id: m.id,
          owned_by: m.owned_by
        })),
        mcp: mcpStats,
        capabilities: [
          'Anomaly Detection',
          'Predictive Analytics',
          'Dashboard Generation',
          'Explainable AI',
          'Vector-Augmented Knowledge',
          'Natural Language Querying',
          'MCP-Grafana Integration'
        ]
      };
    } catch (error) {
      logger.error(`Error getting AI stats: ${error.message}`, { 
        stack: error.stack
      });
      return {
        success: false,
        error: 'Failed to get AI statistics',
        message: error.message
      };
    }
  }
};

/**
 * Get AI model performance metrics
 * @param {string} timeRange - Time range for metrics (24h, 7d, 30d)
 * @returns {Promise<Object>} - Model performance metrics
 */
advancedAIService.getModelPerformance = async (timeRange) => {
  try {
    // In a real implementation, this would query metrics data from a database
    // For demo purposes, we'll generate mock performance data
    
    // Seed a consistent random number generator based on timeRange
    const seedRandom = (str) => {
      let seed = 0;
      for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed) + str.charCodeAt(i);
        seed = seed & seed; // Convert to 32bit integer
      }
      
      // Simple random function with seed
      return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
    };
    
    const random = seedRandom(timeRange);
    
    // Generate model usage data
    const modelUsage = [
      { 
        name: 'anomaly-detection', 
        percentage: Math.round(25 + random() * 10),
        count: Math.round(500 + random() * 1000),
        color: '#3f51b5' 
      },
      { 
        name: 'predictive-analytics', 
        percentage: Math.round(20 + random() * 10),
        count: Math.round(400 + random() * 800),
        color: '#f44336' 
      },
      { 
        name: 'dashboard-generator', 
        percentage: Math.round(15 + random() * 8),
        count: Math.round(300 + random() * 600),
        color: '#4caf50' 
      },
      { 
        name: 'explainable-ai', 
        percentage: Math.round(10 + random() * 8),
        count: Math.round(200 + random() * 400),
        color: '#ff9800' 
      },
      { 
        name: 'vector-augmented', 
        percentage: Math.round(25 + random() * 10),
        count: Math.round(500 + random() * 1000),
        color: '#2196f3' 
      }
    ];
    
    // Ensure percentages add up to 100%
    const totalPercentage = modelUsage.reduce((sum, model) => sum + model.percentage, 0);
    const adjustmentFactor = 100 / totalPercentage;
    
    modelUsage.forEach(model => {
      model.percentage = Math.round(model.percentage * adjustmentFactor);
    });
    
    // Generate request types data
    const requestTypes = [
      {
        name: 'NLP Queries',
        count: Math.round(800 + random() * 1500),
        successRate: 0.92 + random() * 0.08
      },
      {
        name: 'Anomaly Detection',
        count: Math.round(500 + random() * 1000),
        successRate: 0.95 + random() * 0.05
      },
      {
        name: 'Predictive Analytics',
        count: Math.round(300 + random() * 600),
        successRate: 0.90 + random() * 0.09
      },
      {
        name: 'Dashboard Generation',
        count: Math.round(200 + random() * 400),
        successRate: 0.85 + random() * 0.14
      }
    ];
    
    // Generate error data (fewer errors for longer timeframes)
    const errorMultiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 3 : 10;
    const totalErrors = Math.round((100 + random() * 200) * errorMultiplier);
    
    const errors = [
      {
        type: 'Rate Limit Exceeded',
        count: Math.round(totalErrors * (0.3 + random() * 0.2)),
        percentage: 0
      },
      {
        type: 'Timeout',
        count: Math.round(totalErrors * (0.2 + random() * 0.2)),
        percentage: 0
      },
      {
        type: 'Invalid Input',
        count: Math.round(totalErrors * (0.15 + random() * 0.15)),
        percentage: 0
      },
      {
        type: 'Model Error',
        count: Math.round(totalErrors * (0.1 + random() * 0.1)),
        percentage: 0
      },
      {
        type: 'Other',
        count: 0, // Will be calculated to make sum match totalErrors
        percentage: 0
      }
    ];
    
    // Adjust error counts to match totalErrors
    const currentErrorSum = errors.reduce((sum, error) => sum + error.count, 0);
    errors[4].count = totalErrors - currentErrorSum;
    
    // Calculate error percentages
    errors.forEach(error => {
      error.percentage = (error.count / totalErrors) * 100;
    });
    
    // Generate model details
    const models = modelUsage.map(model => {
      const baseResponseTime = {
        min: 0.1 + random() * 0.2,
        max: 1.0 + random() * 3.0,
        avg: 0
      };
      
      baseResponseTime.avg = baseResponseTime.min + (baseResponseTime.max - baseResponseTime.min) * 0.4;
      
      return {
        name: model.name,
        status: random() > 0.1 ? 'active' : 'inactive',
        responseTime: baseResponseTime,
        successRate: 0.8 + random() * 0.19,
        totalRequests: model.count,
        usageRatio: model.percentage,
        usageTrend: -5 + random() * 10,
        topRequestTypes: requestTypes
          .sort(() => 0.5 - random())
          .slice(0, 3)
          .map(type => ({
            name: type.name,
            count: Math.round(type.count * (0.2 + random() * 0.5)),
            successRate: 0.7 + random() * 0.29
          }))
      };
    });
    
    // Generate feedback data
    const feedbackData = {
      averageRating: 3.5 + random() * 1.0,
      feedbackCount: Math.round(500 + random() * 1000),
      feedbackParticipationRate: 0.1 + random() * 0.3,
      ratingDistribution: [
        { value: 5, percentage: Math.round(30 + random() * 20) },
        { value: 4, percentage: Math.round(30 + random() * 20) },
        { value: 3, percentage: Math.round(20 + random() * 10) },
        { value: 2, percentage: Math.round(5 + random() * 10) },
        { value: 1, percentage: Math.round(1 + random() * 9) }
      ],
      commonTags: [
        { name: 'Accurate', count: Math.round(300 + random() * 200), averageRating: 4.5 + random() * 0.5 },
        { name: 'Fast', count: Math.round(250 + random() * 150), averageRating: 4.3 + random() * 0.6 },
        { name: 'Helpful', count: Math.round(200 + random() * 150), averageRating: 4.0 + random() * 0.9 },
        { name: 'Clear', count: Math.round(150 + random() * 100), averageRating: 3.8 + random() * 0.7 },
        { name: 'Confusing', count: Math.round(50 + random() * 100), averageRating: 2.0 + random() * 1.0 },
        { name: 'Slow', count: Math.round(30 + random() * 70), averageRating: 2.5 + random() * 1.0 },
        { name: 'Irrelevant', count: Math.round(20 + random() * 50), averageRating: 1.5 + random() * 1.0 }
      ]
    };
    
    // Ensure rating distribution adds up to 100%
    const totalRatingPercentage = feedbackData.ratingDistribution.reduce((sum, rating) => sum + rating.percentage, 0);
    const ratingAdjustmentFactor = 100 / totalRatingPercentage;
    
    feedbackData.ratingDistribution.forEach(rating => {
      rating.percentage = Math.round(rating.percentage * ratingAdjustmentFactor);
    });
    
    // Calculate total requests
    const totalRequests = modelUsage.reduce((sum, model) => sum + model.count, 0);
    
    // Calculate successful requests
    const successfulRequests = requestTypes.reduce((sum, type) => sum + Math.round(type.count * type.successRate), 0);
    
    return {
      totalModels: models.length,
      totalInteractions: totalRequests,
      successRate: successfulRequests / totalRequests,
      avgResponseTime: models.reduce((sum, model) => sum + model.responseTime.avg, 0) / models.length,
      modelUsage,
      requestTypes,
      errors,
      models,
      feedback: feedbackData
    };
  } catch (error) {
    logger.error(`Error getting model performance: ${error.message}`, { 
      stack: error.stack,
      timeRange
    });
    throw error;
  }
};

/**
 * Get AI interactions for feedback
 * @returns {Promise<Array>} - List of AI interactions
 */
advancedAIService.getAIInteractions = async () => {
  try {
    // In a real implementation, this would query a database of AI interactions
    // For demo purposes, we'll generate mock interactions
    
    const getRandomDate = (daysBack) => {
      const date = new Date();
      date.setDate(date.getDate() - Math.random() * daysBack);
      return date.toISOString();
    };
    
    const interactionTypes = [
      'NLP Query',
      'Anomaly Detection',
      'Predictive Analytics',
      'Dashboard Generation'
    ];
    
    const modelNames = [
      'anomaly-detection',
      'predictive-analytics',
      'dashboard-generator',
      'explainable-ai',
      'vector-augmented'
    ];
    
    const tags = [
      'Accurate', 'Inaccurate', 'Helpful', 'Unhelpful', 
      'Fast', 'Slow', 'Clear', 'Confusing', 'Relevant', 'Irrelevant'
    ];
    
    // Generate 20 random interactions
    const interactions = Array.from({ length: 20 }, (_, i) => {
      const hasRating = Math.random() > 0.4;
      
      return {
        id: `interaction-${i + 1}`,
        interactionType: interactionTypes[Math.floor(Math.random() * interactionTypes.length)],
        timestamp: getRandomDate(7),
        model: modelNames[Math.floor(Math.random() * modelNames.length)],
        query: `Sample query ${i + 1}`,
        responseTime: 0.2 + Math.random() * 2.0,
        rating: hasRating ? Math.floor(Math.random() * 5) + 1 : null,
        tags: hasRating ? Array.from(
          { length: Math.floor(Math.random() * 3) + 1 },
          () => tags[Math.floor(Math.random() * tags.length)]
        ) : []
      };
    });
    
    // Sort by timestamp (newest first)
    return interactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    logger.error(`Error getting AI interactions: ${error.message}`, { 
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Submit feedback for AI interaction
 * @param {string} interactionId - Interaction ID
 * @param {number} rating - Rating (1-5)
 * @param {string} comment - Optional comment
 * @param {Array} tags - Optional feedback tags
 * @returns {Promise<Object>} - Feedback result
 */
advancedAIService.submitFeedback = async (interactionId, rating, comment, tags) => {
  try {
    // In a real implementation, this would store the feedback in a database
    // For demo purposes, we'll just return success
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    logger.info(`Feedback submitted for interaction ${interactionId}: Rating ${rating}`);
    
    return {
      interactionId,
      timestamp: new Date().toISOString(),
      rating,
      comment: comment || null,
      tags: tags || []
    };
  } catch (error) {
    logger.error(`Error submitting feedback: ${error.message}`, { 
      stack: error.stack,
      interactionId,
      rating
    });
    throw error;
  }
};

module.exports = advancedAIService;