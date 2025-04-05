const User = require('../models/User');
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
  defaultMeta: { service: 'api-key-auth' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/api-auth-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/api-auth-combined.log' })
  ]
});

/**
 * API key authentication middleware
 * This allows API access using either JWT or API key
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    // Check if already authenticated via JWT
    if (req.user) {
      return next();
    }
    
    // Get API key from header
    const apiKey = req.header('X-API-Key');
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }
    
    // Find user by API key
    const user = await User.findOne({
      apiKey: apiKey,
      apiKeyExpiry: { $gt: Date.now() }
    });
    
    if (!user || !user.isActive) {
      logger.warn('Invalid or expired API key used', {
        apiKey: apiKey.substring(0, 8) + '...',
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired API key'
      });
    }
    
    // Set user in request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role
    };
    
    // Record API key usage
    await User.findByIdAndUpdate(user._id, {
      $inc: { apiKeyUsageCount: 1 },
      $set: { lastApiKeyUsed: Date.now() }
    });
    
    logger.debug('API key authentication successful', {
      userId: user._id,
      apiKey: apiKey.substring(0, 8) + '...'
    });
    
    next();
  } catch (error) {
    logger.error(`API key authentication error: ${error.message}`, {
      stack: error.stack
    });
    
    return res.status(500).json({
      success: false,
      message: 'Server error during API key authentication'
    });
  }
};

module.exports = apiKeyAuth;