const Redis = require('ioredis');
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
  defaultMeta: { service: 'cache-service' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/cache-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/cache-combined.log' })
  ]
});

// Create Redis client
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Handle Redis connection events
redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('error', (err) => {
  logger.error('Redis error:', err);
});

/**
 * Cache service for metrics data
 */
const cacheService = {
  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} - Cached data or null
   */
  async get(key) {
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(cachedData);
      }
      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Error getting data from cache: ${error.message}`, { 
        stack: error.stack,
        key 
      });
      return null;
    }
  },
  
  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, data, ttlSeconds = 300) {
    try {
      await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
      logger.debug(`Cached data for key: ${key}, TTL: ${ttlSeconds}s`);
      return true;
    } catch (error) {
      logger.error(`Error setting data in cache: ${error.message}`, { 
        stack: error.stack,
        key 
      });
      return false;
    }
  },
  
  /**
   * Delete data from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async delete(key) {
    try {
      await redisClient.del(key);
      logger.debug(`Deleted cache for key: ${key}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting data from cache: ${error.message}`, { 
        stack: error.stack,
        key 
      });
      return false;
    }
  },
  
  /**
   * Clear all cached data
   * @returns {Promise<boolean>} - Success status
   */
  async clear() {
    try {
      await redisClient.flushdb();
      logger.info('Cleared all cached data');
      return true;
    } catch (error) {
      logger.error(`Error clearing cache: ${error.message}`, { 
        stack: error.stack 
      });
      return false;
    }
  },
  
  /**
   * Cache API response
   * @param {Function} targetFunction - The function to cache (should return a promise)
   * @param {string} keyPrefix - Prefix for cache key
   * @param {number} ttlSeconds - Time to live in seconds
   * @returns {Function} - Wrapped function with caching
   */
  cacheAPIResponse(targetFunction, keyPrefix, ttlSeconds) {
    return async (...args) => {
      const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;
      
      // Try to get from cache first
      const cachedData = await this.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      // If not in cache, call the original function
      const result = await targetFunction(...args);
      
      // Cache the result for future requests
      await this.set(cacheKey, result, ttlSeconds);
      
      return result;
    };
  },
  
  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache statistics
   */
  async getStats() {
    try {
      const info = await redisClient.info();
      const stats = {};
      
      // Parse info response
      info.split('\r\n').forEach(line => {
        const parts = line.split(':');
        if (parts.length === 2) {
          stats[parts[0]] = parts[1];
        }
      });
      
      // Get memory usage in MB
      const memoryUsage = stats.used_memory_human || 'Unknown';
      
      // Get total keys count
      const dbSize = await redisClient.dbsize();
      
      return {
        memoryUsage,
        totalKeys: dbSize,
        uptime: stats.uptime_in_seconds || 0,
        connected: redisClient.status === 'ready'
      };
    } catch (error) {
      logger.error(`Error getting cache stats: ${error.message}`, { 
        stack: error.stack 
      });
      return {
        error: 'Failed to get cache statistics',
        connected: false
      };
    }
  }
};

module.exports = cacheService;