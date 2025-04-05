const express = require('express');
const axios = require('axios');
const router = express.Router();

// LiteLLM API endpoint
const LITELLM_URL = process.env.LITELLM_URL || 'http://litellm:4000';

/**
 * Process natural language query
 * @route POST /api/nlp/query
 * @param {string} query - Natural language query about CERTIHASH data
 * @returns {object} Response with processed query result
 */
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Call LiteLLM for processing
    const response = await axios.post(`${LITELLM_URL}/v1/chat/completions`, {
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: `You are an AI assistant for analyzing CERTIHASH blockchain data. 
                    Convert natural language queries into appropriate Prometheus queries, 
                    dashboard links, or analysis directives. CERTIHASH has metrics like 
                    certihash_transactions_total, certihash_tps, and certihash_tx_processing_time.`
        },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    }, {
      headers: { 
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`
      }
    });
    
    // Extract and parse response
    const content = response.data.choices[0].message.content;
    const parsedResponse = JSON.parse(content);
    
    res.json(parsedResponse);
  } catch (error) {
    console.error('Error processing NLP query:', error.message);
    res.status(500).json({ 
      error: 'Failed to process query',
      details: error.message
    });
  }
});

/**
 * Get anomaly detection results
 * @route GET /api/nlp/anomalies
 * @returns {object} Recent anomaly detection results
 */
router.get('/anomalies', async (req, res) => {
  try {
    // Call LiteLLM for anomaly detection
    const response = await axios.post(`${LITELLM_URL}/v1/chat/completions`, {
      model: 'anomaly-detection',
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI specialized in detecting anomalies in blockchain transaction data.'
        },
        { 
          role: 'user', 
          content: 'Analyze recent CERTIHASH TPS data for anomalies and return results as JSON.'
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    }, {
      headers: { 
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`
      }
    });
    
    // Extract and parse response
    const content = response.data.choices[0].message.content;
    const parsedResponse = JSON.parse(content);
    
    res.json(parsedResponse);
  } catch (error) {
    console.error('Error getting anomalies:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve anomalies',
      details: error.message
    });
  }
});

/**
 * Get transaction predictions
 * @route GET /api/nlp/predictions
 * @returns {object} Transaction volume predictions
 */
router.get('/predictions', async (req, res) => {
  try {
    // Call LiteLLM for predictive analytics
    const response = await axios.post(`${LITELLM_URL}/v1/chat/completions`, {
      model: 'predictive-analytics',
      messages: [
        { 
          role: 'system', 
          content: 'You are a predictive analytics AI specializing in blockchain transaction forecasting.'
        },
        { 
          role: 'user', 
          content: 'Forecast CERTIHASH transaction volumes for the next 7 days based on recent data. Return as JSON.'
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    }, {
      headers: { 
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`
      }
    });
    
    // Extract and parse response
    const content = response.data.choices[0].message.content;
    const parsedResponse = JSON.parse(content);
    
    res.json(parsedResponse);
  } catch (error) {
    console.error('Error getting predictions:', error.message);
    res.status(500).json({ 
      error: 'Failed to retrieve predictions',
      details: error.message
    });
  }
});

module.exports = router;