const redis = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
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
  defaultMeta: { service: 'rate-limiter' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/rate-limiter-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/rate-limiter-combined.log' })
  ]
});

// Configure Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'redis',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  enable_offline_queue: false,
});

redisClient.on('error', (err) => {
  logger.error(`Redis error: ${err.message}`, { stack: err.stack });
});

// Different rate limiters for different types of requests
const rateLimiters = {
  // General API rate limiter (higher limit)
  api: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'ratelimit_api',
    points: 100, // Number of points
    duration: 60, // Per 60 seconds
  }),
  
  // Auth-specific rate limiter (stricter)
  auth: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'ratelimit_auth',
    points: 10, // Number of points
    duration: 60, // Per 60 seconds
    blockDuration: 300, // Block for 5 minutes after exceeding limit
  }),
  
  // AI-specific rate limiter (medium)
  ai: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'ratelimit_ai',
    points: 30, // Number of points
    duration: 60, // Per 60 seconds
  }),
  
  // Admin operation rate limiter (stricter)
  admin: new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'ratelimit_admin',
    points: 20, // Number of points
    duration: 60, // Per 60 seconds
  })
};

/**
 * Factory function to create rate limiter middleware
 * @param {string} type - Type of rate limiter (api, auth, ai, admin)
 * @returns {Function} - Express middleware
 */
const createRateLimiterMiddleware = (type = 'api') => {
  const limiter = rateLimiters[type] || rateLimiters.api;
  
  return async (req, res, next) => {
    try {
      // Get client IP for rate limiting
      const clientIp = req.headers['x-forwarded-for'] || 
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress;
      
      // Use user ID for authenticated requests for more accurate limiting
      const key = req.user ? req.user.id : clientIp;
      
      // Consume points
      await limiter.consume(key);
      next();
    } catch (error) {
      if (error.remainingPoints !== undefined) {
        // This is a rate limit error
        logger.warn(`Rate limit exceeded for ${type}`, {
          ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userId: req.user?.id,
          path: req.path,
          method: req.method
        });
        
        res.set('Retry-After', error.msBeforeNext / 1000);
        res.set('X-RateLimit-Limit', limiter.points);
        res.set('X-RateLimit-Remaining', error.remainingPoints);
        res.set('X-RateLimit-Reset', new Date(Date.now() + error.msBeforeNext).toISOString());
        
        return res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later.'
        });
      }
      
      // This is another kind of error
      logger.error(`Rate limiter error: ${error.message}`, { 
        stack: error.stack,
        path: req.path
      });
      next(error);
    }
  };
};

module.exports = {
  apiLimiter: createRateLimiterMiddleware('api'),
  authLimiter: createRateLimiterMiddleware('auth'),
  aiLimiter: createRateLimiterMiddleware('ai'),
  adminLimiter: createRateLimiterMiddleware('admin')
};