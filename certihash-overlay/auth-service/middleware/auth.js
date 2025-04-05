const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createLogger, format, transports } = require('winston');

// Configure logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'auth-middleware' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/auth-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/auth-combined.log' })
  ]
});

/**
 * Middleware to protect routes - JWT validation
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Set user in request
      req.user = decoded;
      
      next();
    } catch (error) {
      logger.error(`Token verification error: ${error.message}`);
      
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired'
      });
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`, { stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

/**
 * Middleware to validate API keys
 */
exports.validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key is required'
      });
    }
    
    // Find user with API key
    const user = await User.findOne({ 
      apiKeyExpiry: { $gt: Date.now() } 
    }).select('+apiKeyHash');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }
    
    // Verify API key
    const isValidKey = await user.verifyApiKey(apiKey);
    
    if (!isValidKey) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }
    
    // Set user in request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      organization: user.organization
    };
    
    next();
  } catch (error) {
    logger.error(`API key validation error: ${error.message}`, { stack: error.stack });
    
    return res.status(500).json({
      success: false,
      message: 'Server error in API key validation'
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param {...string} roles - Roles allowed to access the route
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
};