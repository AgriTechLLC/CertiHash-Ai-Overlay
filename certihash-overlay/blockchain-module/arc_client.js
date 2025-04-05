const axios = require('axios');

/**
 * Arc Transaction Client for BSV blockchain
 * Handles interaction with Arc API for transaction broadcasting and fetching
 */
class ArcClient {
  /**
   * Constructor
   * @param {string} apiUrl - Arc API endpoint
   * @param {string} apiKey - Arc API key
   */
  constructor(apiUrl, apiKey) {
    this.apiUrl = apiUrl || process.env.ARC_API_URL || 'https://api.arc.io/v1';
    this.apiKey = apiKey || process.env.ARC_API_KEY;
    
    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      }
    });
  }
  
  /**
   * Broadcast a transaction to the BSV network
   * @param {string} txHex - Raw transaction hex
   * @returns {Promise<Object>} - Response with txid
   */
  async broadcastTransaction(txHex) {
    try {
      const response = await this.httpClient.post('/transactions', {
        rawTx: txHex
      });
      
      return {
        success: true,
        txid: response.data.txid,
        message: 'Transaction broadcast successfully'
      };
    } catch (error) {
      console.error('Transaction broadcast error:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
  
  /**
   * Get transaction details
   * @param {string} txid - Transaction ID
   * @returns {Promise<Object>} - Transaction details
   */
  async getTransaction(txid) {
    try {
      const response = await this.httpClient.get(`/transactions/${txid}`);
      return {
        success: true,
        transaction: response.data
      };
    } catch (error) {
      console.error('Get transaction error:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
  
  /**
   * Get current transaction fees
   * @returns {Promise<Object>} - Fee rates
   */
  async getFees() {
    try {
      const response = await this.httpClient.get('/fees');
      return {
        success: true,
        fees: response.data
      };
    } catch (error) {
      console.error('Get fees error:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = ArcClient;