const axios = require('axios');
const jwt = require('jsonwebtoken');
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
  defaultMeta: { service: 'ui-auth' },
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

// Auth service URL
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3002';

/**
 * Client to interact with authentication service
 */
const authClient = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration response
   */
  register: async (userData) => {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/register`, userData);
      return response.data;
    } catch (error) {
      logger.error(`Registration error: ${error.message}`, { userData });
      throw error.response?.data || { success: false, message: 'Registration failed' };
    }
  },
  
  /**
   * Login a user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} - Login response with token
   */
  login: async (credentials) => {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, credentials);
      return response.data;
    } catch (error) {
      logger.error(`Login error: ${error.message}`, { email: credentials.email });
      throw error.response?.data || { success: false, message: 'Login failed' };
    }
  },
  
  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} - New tokens
   */
  refreshToken: async (refreshToken) => {
    try {
      const response = await axios.post(
        `${AUTH_SERVICE_URL}/api/auth/refresh-token`,
        {},
        {
          headers: {
            Cookie: `refreshToken=${refreshToken}`
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`Token refresh error: ${error.message}`);
      throw error.response?.data || { success: false, message: 'Token refresh failed' };
    }
  },
  
  /**
   * Get current user profile
   * @param {string} token - Access token
   * @returns {Promise<Object>} - User profile
   */
  getCurrentUser: async (token) => {
    try {
      const response = await axios.get(
        `${AUTH_SERVICE_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`Get user profile error: ${error.message}`);
      throw error.response?.data || { success: false, message: 'Failed to get user profile' };
    }
  },
  
  /**
   * Generate API key
   * @param {string} token - Access token
   * @returns {Promise<Object>} - API key
   */
  generateApiKey: async (token) => {
    try {
      const response = await axios.post(
        `${AUTH_SERVICE_URL}/api/auth/api-key`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      logger.error(`API key generation error: ${error.message}`);
      throw error.response?.data || { success: false, message: 'Failed to generate API key' };
    }
  },
  
  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<Object>} - Reset response
   */
  forgotPassword: async (email) => {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      logger.error(`Password reset request error: ${error.message}`, { email });
      throw error.response?.data || { success: false, message: 'Failed to request password reset' };
    }
  },
  
  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   * @returns {Promise<Object>} - Reset response
   */
  resetPassword: async (token, password) => {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (error) {
      logger.error(`Password reset error: ${error.message}`);
      throw error.response?.data || { success: false, message: 'Password reset failed' };
    }
  },
  
  /**
   * Verify email with token
   * @param {string} token - Verification token
   * @returns {Promise<Object>} - Verification response
   */
  verifyEmail: async (token) => {
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify/${token}`);
      return response.data;
    } catch (error) {
      logger.error(`Email verification error: ${error.message}`);
      throw error.response?.data || { success: false, message: 'Email verification failed' };
    }
  }
};

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Set user in request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error(`Token verification error: ${error.message}`);
    
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = {
  authClient,
  verifyToken
};