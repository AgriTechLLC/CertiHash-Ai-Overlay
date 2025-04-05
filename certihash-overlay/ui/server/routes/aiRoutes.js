const express = require('express');
const router = express.Router();
const advancedAIService = require('../services/ai/advancedAIService');
const { verifyToken } = require('../auth');

// Initialize AI service
(async () => {
  await advancedAIService.initialize();
})();

// All AI routes require authentication
router.use(verifyToken);

/**
 * Get AI capabilities and stats
 * @route GET /api/ai/capabilities
 */
router.get('/capabilities', async (req, res) => {
  try {
    const stats = await advancedAIService.getAIStats();
    
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Error getting AI capabilities:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get AI capabilities',
      error: error.message
    });
  }
});

/**
 * Detect anomalies in transaction data
 * @route POST /api/ai/anomalies
 */
router.post('/anomalies', async (req, res) => {
  try {
    const { data, explain } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Transaction data is required'
      });
    }
    
    const result = await advancedAIService.detectAnomalies(data, explain);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to detect anomalies',
      error: error.message
    });
  }
});

/**
 * Get recent anomalies for the AI Assistant
 * @route GET /api/ai/anomalies
 */
router.get('/anomalies', async (req, res) => {
  try {
    const { timeRange } = req.query;
    const validTimeRanges = ['1h', '6h', '24h', '7d'];
    
    if (!timeRange || !validTimeRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Valid timeRange parameter required (1h, 6h, 24h, or 7d)'
      });
    }
    
    const anomalies = await advancedAIService.getRecentAnomalies(timeRange);
    
    res.json(anomalies);
  } catch (error) {
    console.error('Error getting anomalies:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve anomalies',
      error: error.message
    });
  }
});

/**
 * Predict future transaction patterns
 * @route POST /api/ai/predict
 */
router.post('/predict', async (req, res) => {
  try {
    const { historicalData, forecastDays } = req.body;
    
    if (!historicalData || !Array.isArray(historicalData)) {
      return res.status(400).json({
        success: false,
        message: 'Historical data array is required'
      });
    }
    
    const result = await advancedAIService.predictTransactions(
      historicalData, 
      forecastDays || 7
    );
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error predicting transactions:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to predict transactions',
      error: error.message
    });
  }
});

/**
 * Generate dashboard configuration
 * @route POST /api/ai/dashboard
 */
router.post('/dashboard', async (req, res) => {
  try {
    const { name, description, panels } = req.body;
    
    if (!name || !description || !panels) {
      return res.status(400).json({
        success: false,
        message: 'Dashboard name, description, and panels are required'
      });
    }
    
    const result = await advancedAIService.generateDashboard(name, description, panels);
    
    res.json({
      success: true,
      dashboard: result
    });
  } catch (error) {
    console.error('Error generating dashboard:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard',
      error: error.message
    });
  }
});

/**
 * Process natural language query
 * @route POST /api/ai/query
 */
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }
    
    const result = await advancedAIService.processQuery(query);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error processing query:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to process query',
      error: error.message
    });
  }
});

/**
 * Process NLP query for the new AI Assistant
 * @route POST /api/ai/nlp-query
 */
router.post('/nlp-query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required'
      });
    }
    
    const result = await advancedAIService.processNLPQuery(query);
    
    res.json({
      success: true,
      answer: result.answer,
      sources: result.sources,
      grafanaUrl: result.grafanaUrl
    });
  } catch (error) {
    console.error('Error processing NLP query:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to process query',
      error: error.message
    });
  }
});

/**
 * Store document in vector store
 * @route POST /api/ai/knowledge
 */
router.post('/knowledge', async (req, res) => {
  try {
    // Check if user has admin role
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to add knowledge'
      });
    }
    
    const { text, source, category } = req.body;
    
    if (!text || !source || !category) {
      return res.status(400).json({
        success: false,
        message: 'Text, source, and category are required'
      });
    }
    
    const vectorStore = require('../services/ai/vectorStore');
    const result = await vectorStore.storeDocument(text, source, category);
    
    res.json({
      success: result,
      message: result ? 'Document stored successfully' : 'Failed to store document'
    });
  } catch (error) {
    console.error('Error storing document:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to store document',
      error: error.message
    });
  }
});

/**
 * Generate predictive analytics
 * @route POST /api/ai/predictive-analytics
 */
router.post('/predictive-analytics', async (req, res) => {
  try {
    const { metricType, timeWindow, predictionHorizon } = req.body;
    
    if (!metricType || !timeWindow || !predictionHorizon) {
      return res.status(400).json({
        success: false,
        message: 'Metric type, time window, and prediction horizon are required'
      });
    }
    
    const result = await advancedAIService.generatePredictiveAnalytics(
      metricType,
      timeWindow,
      predictionHorizon
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error generating predictive analytics:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate predictive analytics',
      error: error.message
    });
  }
});

/**
 * Generate dashboard suggestions
 * @route POST /api/ai/dashboard-suggestions
 */
router.post('/dashboard-suggestions', async (req, res) => {
  try {
    const { description } = req.body;
    
    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Dashboard description is required'
      });
    }
    
    const result = await advancedAIService.generateDashboardSuggestions(description);
    
    res.json(result);
  } catch (error) {
    console.error('Error generating dashboard suggestions:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard suggestions',
      error: error.message
    });
  }
});

/**
 * Generate dashboard preview
 * @route POST /api/ai/dashboard-preview
 */
router.post('/dashboard-preview', async (req, res) => {
  try {
    const { title, type, metrics, timeRange, refreshInterval } = req.body;
    
    if (!title || !type || !metrics || !metrics.length) {
      return res.status(400).json({
        success: false,
        message: 'Dashboard title, type, and metrics are required'
      });
    }
    
    const result = await advancedAIService.generateDashboardPreview(
      title,
      type,
      metrics,
      timeRange,
      refreshInterval
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error generating dashboard preview:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard preview',
      error: error.message
    });
  }
});

/**
 * Create dashboard
 * @route POST /api/ai/create-dashboard
 */
router.post('/create-dashboard', async (req, res) => {
  try {
    const { title, type, metrics, timeRange, refreshInterval } = req.body;
    
    if (!title || !type || !metrics || !metrics.length) {
      return res.status(400).json({
        success: false,
        message: 'Dashboard title, type, and metrics are required'
      });
    }
    
    const result = await advancedAIService.createDashboard(
      title,
      type,
      metrics,
      timeRange,
      refreshInterval
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error creating dashboard:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to create dashboard',
      error: error.message
    });
  }
});

/**
 * Get AI model performance metrics
 * @route GET /api/ai/model-performance
 */
router.get('/model-performance', async (req, res) => {
  try {
    const { timeRange } = req.query;
    const validTimeRanges = ['24h', '7d', '30d'];
    
    if (!timeRange || !validTimeRanges.includes(timeRange)) {
      return res.status(400).json({
        success: false,
        message: 'Valid timeRange parameter required (24h, 7d, or 30d)'
      });
    }
    
    const result = await advancedAIService.getModelPerformance(timeRange);
    
    res.json(result);
  } catch (error) {
    console.error('Error getting model performance:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve model performance data',
      error: error.message
    });
  }
});

/**
 * Get AI interactions for feedback
 * @route GET /api/ai/feedback
 */
router.get('/feedback', async (req, res) => {
  try {
    const result = await advancedAIService.getAIInteractions();
    
    res.json(result);
  } catch (error) {
    console.error('Error getting AI interactions:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI interactions',
      error: error.message
    });
  }
});

/**
 * Submit feedback for AI interaction
 * @route POST /api/ai/feedback
 */
router.post('/feedback', async (req, res) => {
  try {
    const { interactionId, rating, comment, tags } = req.body;
    
    if (!interactionId || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Interaction ID and rating are required'
      });
    }
    
    const result = await advancedAIService.submitFeedback(interactionId, rating, comment, tags);
    
    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      ...result
    });
  } catch (error) {
    console.error('Error submitting feedback:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

module.exports = router;