const axios = require('axios');
const BSVSignature = require('./bsv_signature');
const ArcClient = require('./arc_client');

/**
 * BlockchainClient for CERTIHASH
 * Provides unified interface for BSV blockchain interactions
 */
class BlockchainClient {
  /**
   * Constructor
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      whatsonchainUrl: 'https://api.whatsonchain.com/v1/bsv/main',
      arcApiUrl: process.env.ARC_API_URL,
      arcApiKey: process.env.ARC_API_KEY,
      ...config
    };
    
    // Initialize Arc client if credentials available
    if (this.config.arcApiUrl && this.config.arcApiKey) {
      this.arcClient = new ArcClient(this.config.arcApiUrl, this.config.arcApiKey);
    }
  }
  
  /**
   * Verify a transaction on the blockchain
   * @param {string} txid - Transaction ID to verify
   * @returns {Promise<Object>} - Transaction details
   */
  async verifyTransaction(txid) {
    try {
      // Try Arc client first if available
      if (this.arcClient) {
        const arcResult = await this.arcClient.getTransaction(txid);
        if (arcResult.success) {
          return arcResult.transaction;
        }
      }
      
      // Fallback to WhatsOnChain
      const response = await axios.get(`${this.config.whatsonchainUrl}/tx/${txid}`);
      return {
        success: true,
        transaction: response.data
      };
    } catch (error) {
      console.error('Transaction verification error:', error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
  
  /**
   * Get transaction metrics for a specific application
   * @param {string} appId - Application identifier
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Transaction metrics
   */
  async getAppTransactions(appId, options = {}) {
    try {
      // This would connect to a BSV indexing service or custom API
      // For demo purposes, we're mocking the response
      const metrics = {
        appId,
        totalTransactions: Math.floor(Math.random() * 1000000),
        averageTps: Math.random() * 100,
        recentTransactions: []
      };
      
      return {
        success: true,
        metrics
      };
    } catch (error) {
      console.error('Get app transactions error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Broadcast a signed transaction
   * @param {string} txHex - Raw transaction hex
   * @returns {Promise<Object>} - Broadcast result
   */
  async broadcastTransaction(txHex) {
    // Use Arc client if available
    if (this.arcClient) {
      return await this.arcClient.broadcastTransaction(txHex);
    }
    
    // Fallback to WhatsOnChain
    try {
      const response = await axios.post(`${this.config.whatsonchainUrl}/tx/raw`, {
        txhex: txHex
      });
      
      return {
        success: true,
        txid: response.data
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
   * Verify a signature
   * @param {string} message - Original message
   * @param {string} signature - Signature to verify
   * @param {string} publicKey - Public key
   * @returns {boolean} - Verification result
   */
  verifySignature(message, signature, publicKey) {
    return BSVSignature.verify(message, signature, publicKey);
  }
  
  /**
   * Sign a message
   * @param {string} message - Message to sign
   * @param {string} privateKey - Private key
   * @returns {string} - Signature
   */
  signMessage(message, privateKey) {
    return BSVSignature.sign(message, privateKey);
  }
  
  /**
   * Generate a new key pair
   * @returns {Object} - { privateKey, publicKey }
   */
  generateKeyPair() {
    return BSVSignature.generateKeyPair();
  }
}

module.exports = BlockchainClient;