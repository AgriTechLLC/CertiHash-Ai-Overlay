const { createLogger, format, transports } = require('winston');
const { MilvusClient } = require('@zilliz/milvus2-sdk-node');
const axios = require('axios');

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
  defaultMeta: { service: 'vector-store' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/vector-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/vector-combined.log' })
  ]
});

// Initialize Milvus client
const milvusClient = new MilvusClient({
  address: `${process.env.MILVUS_HOST || 'vector-db'}:${process.env.MILVUS_PORT || '19530'}`,
  username: process.env.MILVUS_USERNAME,
  password: process.env.MILVUS_PASSWORD
});

// Collection parameters
const COLLECTION_NAME = 'certihash_knowledge';
const VECTOR_DIM = 1536; // OpenAI embedding dimension
const EMBEDDING_MODEL = 'text-embedding-3-large';

/**
 * Service for vector storage and retrieval
 */
const vectorStore = {
  /**
   * Initialize vector collection
   * @returns {Promise<boolean>} - Success status
   */
  async initialize() {
    try {
      // Check if collection exists
      const hasCollection = await milvusClient.hasCollection({
        collection_name: COLLECTION_NAME
      });
      
      if (!hasCollection) {
        // Create collection
        await milvusClient.createCollection({
          collection_name: COLLECTION_NAME,
          fields: [
            {
              name: 'id',
              description: 'ID field',
              data_type: 5, // DataType.Int64
              is_primary_key: true,
              autoID: true
            },
            {
              name: 'text',
              description: 'Original text',
              data_type: 21, // DataType.VarChar
              max_length: 65535
            },
            {
              name: 'source',
              description: 'Source of the text',
              data_type: 21, // DataType.VarChar
              max_length: 255
            },
            {
              name: 'category',
              description: 'Knowledge category',
              data_type: 21, // DataType.VarChar
              max_length: 255
            },
            {
              name: 'embedding',
              description: 'Text embedding vector',
              data_type: 101, // DataType.FloatVector
              dim: VECTOR_DIM
            }
          ]
        });
        
        // Create index
        await milvusClient.createIndex({
          collection_name: COLLECTION_NAME,
          field_name: 'embedding',
          index_type: 'HNSW',
          metric_type: 'COSINE',
          params: { M: 8, efConstruction: 64 }
        });
        
        logger.info(`Created collection: ${COLLECTION_NAME}`);
      } else {
        logger.info(`Collection ${COLLECTION_NAME} already exists`);
      }
      
      // Load collection
      await milvusClient.loadCollection({
        collection_name: COLLECTION_NAME
      });
      
      logger.info('Vector store initialized successfully');
      return true;
    } catch (error) {
      logger.error(`Error initializing vector store: ${error.message}`, { 
        stack: error.stack 
      });
      return false;
    }
  },
  
  /**
   * Generate embedding for text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: text,
          model: EMBEDDING_MODEL
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data[0].embedding;
    } catch (error) {
      logger.error(`Error generating embedding: ${error.message}`, { 
        stack: error.stack, 
        text: text.substring(0, 100) 
      });
      throw error;
    }
  },
  
  /**
   * Store document in vector store
   * @param {string} text - Document text
   * @param {string} source - Document source
   * @param {string} category - Knowledge category
   * @returns {Promise<boolean>} - Success status
   */
  async storeDocument(text, source, category) {
    try {
      // Generate embedding
      const embedding = await this.generateEmbedding(text);
      
      // Insert into collection
      await milvusClient.insert({
        collection_name: COLLECTION_NAME,
        fields_data: [{
          text,
          source,
          category,
          embedding
        }]
      });
      
      logger.info(`Stored document from source: ${source}, category: ${category}`);
      return true;
    } catch (error) {
      logger.error(`Error storing document: ${error.message}`, { 
        stack: error.stack, 
        source, 
        category 
      });
      return false;
    }
  },
  
  /**
   * Search for similar documents
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @param {string} category - Optional category filter
   * @returns {Promise<Array>} - Search results
   */
  async searchSimilar(query, limit = 5, category = null) {
    try {
      // Generate query embedding
      const embedding = await this.generateEmbedding(query);
      
      // Prepare search parameters
      const searchParams = {
        collection_name: COLLECTION_NAME,
        vector: embedding,
        limit: limit,
        output_fields: ['text', 'source', 'category']
      };
      
      // Add category filter if provided
      if (category) {
        searchParams.filter = `category == "${category}"`;
      }
      
      // Execute search
      const result = await milvusClient.search(searchParams);
      
      // Format results
      return result.results.map(item => ({
        text: item.text,
        source: item.source,
        category: item.category,
        score: item.score
      }));
    } catch (error) {
      logger.error(`Error searching documents: ${error.message}`, { 
        stack: error.stack, 
        query 
      });
      return [];
    }
  },
  
  /**
   * Get statistics about vector store
   * @returns {Promise<Object>} - Statistics
   */
  async getStats() {
    try {
      const stats = await milvusClient.getCollectionStatistics({
        collection_name: COLLECTION_NAME
      });
      
      const entityCount = stats.stats.find(stat => stat.key === 'row_count')?.value || 0;
      
      return {
        totalDocuments: parseInt(entityCount),
        collectionName: COLLECTION_NAME,
        vectorDimension: VECTOR_DIM
      };
    } catch (error) {
      logger.error(`Error getting vector store stats: ${error.message}`, { 
        stack: error.stack 
      });
      return {
        error: 'Failed to get vector store statistics'
      };
    }
  },
  
  /**
   * Store seed knowledge about BSV, CERTIHASH, and blockchain
   * @returns {Promise<boolean>} - Success status
   */
  async seedKnowledge() {
    try {
      const documents = [
        {
          text: "BSV stands for Bitcoin SV (Satoshi Vision), a cryptocurrency that resulted from a hard fork of Bitcoin Cash in 2018. It aims to restore the original Bitcoin protocol as described in the Bitcoin whitepaper by Satoshi Nakamoto. BSV focuses on massive on-chain scaling, with a theoretically unlimited block size, enabling high transaction volumes at low fees. This makes it suitable for enterprise applications requiring high throughput, such as CERTIHASH's transaction monitoring system.",
          source: "BSV Knowledge Base",
          category: "blockchain_basics"
        },
        {
          text: "CERTIHASH is a cybersecurity platform built on the Bitcoin SV (BSV) blockchain. It provides enterprise-grade security solutions leveraging blockchain technology for data integrity, transparency, and immutability. The CERTIHASH Sentinel Node is a high-performance transaction processing system that has demonstrated exceptional capabilities, logging 17,793,793 transactions in a single day on April 5, 2025. This volume surpasses the combined transactions of major blockchains like Bitcoin Core and Ethereum.",
          source: "CERTIHASH Documentation",
          category: "certihash_platform"
        },
        {
          text: "Prometheus is an open-source monitoring and alerting toolkit designed for reliability and scalability. In the CERTIHASH overlay, Prometheus is used to collect and store metrics related to blockchain transactions. It scrapes metrics from the CERTIHASH Sentinel Node, such as transaction count, transactions per second (TPS), and transaction processing time. These metrics are then visualized through Grafana dashboards to provide real-time insights into blockchain performance.",
          source: "Prometheus Documentation",
          category: "monitoring_tools"
        },
        {
          text: "Transactions Per Second (TPS) is a key performance metric for blockchain systems, measuring how many transactions can be processed each second. CERTIHASH's Sentinel Node has demonstrated a TPS of approximately 1,700, which far exceeds Bitcoin Core's 7 TPS and is comparable to Visa's 1,900 TPS. The Teranode architecture for BSV aims to achieve up to 3 million TPS, which would make it one of the most scalable blockchain systems in existence.",
          source: "CERTIHASH Performance Metrics",
          category: "performance_metrics"
        },
        {
          text: "In blockchain analytics, an anomaly refers to an unusual pattern or deviation from expected behavior in transaction data. This could include sudden spikes or drops in transaction volume, unusual transaction sizes, unexpected changes in transaction fees, or suspicious patterns that might indicate security issues. CERTIHASH's AI-powered anomaly detection system uses machine learning to identify these patterns in real-time, allowing for proactive monitoring of the BSV blockchain.",
          source: "Blockchain Analytics Guide",
          category: "anomaly_detection"
        },
        {
          text: "LiteLLM is an AI proxy server that standardizes the inputs and outputs across various LLM providers like OpenAI, Anthropic, and others. In the CERTIHASH overlay, LiteLLM is used to manage AI models for anomaly detection, predictive analytics, and natural language processing. It provides load balancing, model fallbacks, and caching capabilities, ensuring reliable AI service for blockchain analytics.",
          source: "LiteLLM Documentation",
          category: "ai_components"
        },
        {
          text: "The SmartLedger JSON Publisher is a core component of the CERTIHASH platform, responsible for publishing transaction data to the BSV blockchain. It processes transaction data from various sources, validates it, and publishes it to the blockchain with appropriate metadata. The CERTIHASH Prometheus overlay extends this functionality by adding metrics collection and visualization capabilities, providing insights into the performance and behavior of the blockchain system.",
          source: "SmartLedger Technical Docs",
          category: "certihash_platform"
        },
        {
          text: "Arc is a transaction processor used in the CERTIHASH platform for broadcasting transactions to the BSV blockchain. It provides a reliable, high-performance interface for transaction submission, with features like fee estimation, transaction status tracking, and error handling. The Arc client in the CERTIHASH overlay works alongside the BSVSignature class to verify and broadcast transactions, ensuring data integrity and auditability.",
          source: "Arc Documentation",
          category: "blockchain_interaction"
        },
        {
          text: "Grafana is an open-source analytics and monitoring platform that integrates with various data sources, including Prometheus. In the CERTIHASH overlay, Grafana is used to create interactive dashboards for visualizing blockchain transaction data. Key dashboards include the Transaction Volume Dashboard, Comparative Performance Dashboard, and Anomaly Alerts Dashboard, providing real-time insights into blockchain performance and health.",
          source: "Grafana Documentation",
          category: "monitoring_tools"
        },
        {
          text: "MCP (Model Context Protocol) is a protocol that enables AI models to interact with external tools and services. The MCP-Grafana server allows AI models like those in the CERTIHASH overlay to interact directly with Grafana dashboards, executing queries, retrieving dashboard data, and performing actions within the monitoring environment. This enables advanced AI-driven monitoring and analysis capabilities for blockchain transaction data.",
          source: "MCP-Grafana Documentation",
          category: "ai_components"
        }
      ];
      
      // Store each document
      for (const doc of documents) {
        await this.storeDocument(doc.text, doc.source, doc.category);
      }
      
      logger.info(`Seeded ${documents.length} knowledge documents`);
      return true;
    } catch (error) {
      logger.error(`Error seeding knowledge: ${error.message}`, { 
        stack: error.stack 
      });
      return false;
    }
  }
};

module.exports = vectorStore;