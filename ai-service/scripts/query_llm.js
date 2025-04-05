const axios = require('axios');

/**
 * Query LiteLLM for anomaly detection
 * @param {Array} tpsData - Array of TPS values to analyze
 * @returns {Promise<string>} - LLM response with anomaly analysis
 */
async function detectAnomalies(tpsData) {
  try {
    const response = await axios.post('http://litellm:4000/v1/chat/completions', {
      model: 'anomaly-detection',
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI specialized in detecting anomalies in blockchain transaction data. Analyze the TPS data for unusual patterns, spikes, or drops that may indicate issues or interesting events.'
        },
        { 
          role: 'user', 
          content: `Analyze this CERTIHASH TPS data for anomalies: ${JSON.stringify(tpsData)}`
        }
      ],
      temperature: 0.1
    }, {
      headers: { 
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`
      }
    });
    
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error in anomaly detection:', error.message);
    return null;
  }
}

/**
 * Query LiteLLM for predictive analytics
 * @param {Array} historicalData - Historical transaction data
 * @param {number} forecastDays - Number of days to forecast
 * @returns {Promise<object>} - Forecast data
 */
async function predictTransactions(historicalData, forecastDays = 7) {
  try {
    const response = await axios.post('http://litellm:4000/v1/chat/completions', {
      model: 'predictive-analytics',
      messages: [
        { 
          role: 'system', 
          content: 'You are a predictive analytics AI specializing in blockchain transaction forecasting. Analyze historical data and forecast future transaction volumes.'
        },
        { 
          role: 'user', 
          content: `Based on this historical CERTIHASH transaction data: ${JSON.stringify(historicalData)}, forecast the daily transaction volumes for the next ${forecastDays} days. Return the forecast as a JSON array of predicted daily transaction counts.`
        }
      ],
      temperature: 0.2,
      response_format: { type: "json_object" }
    }, {
      headers: { 
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`
      }
    });
    
    // Parse the JSON response
    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error in transaction prediction:', error.message);
    return null;
  }
}

/**
 * Process natural language queries about transaction data
 * @param {string} query - User natural language query
 * @returns {Promise<object>} - Query results
 */
async function processNaturalLanguageQuery(query) {
  try {
    const response = await axios.post('http://litellm:4000/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: 'You are an AI assistant for analyzing CERTIHASH blockchain data. Convert natural language queries into appropriate Prometheus queries or analysis directives.'
        },
        { 
          role: 'user', 
          content: query
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    }, {
      headers: { 
        'Authorization': `Bearer ${process.env.LITELLM_API_KEY}`
      }
    });
    
    // Parse the JSON response
    const content = response.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error('Error in NLP query processing:', error.message);
    return null;
  }
}

module.exports = {
  detectAnomalies,
  predictTransactions,
  processNaturalLanguageQuery
};