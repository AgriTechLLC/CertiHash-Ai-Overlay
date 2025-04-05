const express = require('express');
const router = express.Router();
const { authClient, verifyToken } = require('../auth');
const { apiLimiter, authLimiter } = require('../middleware/rateLimiter');
const { rbac } = require('../middleware/rbac');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
router.post('/register', authLimiter, async (req, res) => {
  try {
    const result = await authClient.register(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

/**
 * Login a user
 * @route POST /api/auth/login
 */
router.post('/login', authLimiter, async (req, res) => {
  try {
    const result = await authClient.login(req.body);
    
    // Set refresh token as HTTP-only cookie
    if (result.refreshToken) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Remove refresh token from response
      delete result.refreshToken;
    }
    
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 401).json(error);
  }
});

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 */
router.post('/refresh-token', authLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided'
      });
    }
    
    const result = await authClient.refreshToken(refreshToken);
    
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 401).json(error);
  }
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
router.get('/me', verifyToken, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const result = await authClient.getCurrentUser(token);
    
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

/**
 * User logout
 * @route POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Generate API key
 * @route POST /api/auth/api-key
 */
router.post('/api-key', verifyToken, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const result = await authClient.generateApiKey(token);
    
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const result = await authClient.forgotPassword(req.body.email);
    
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

/**
 * Reset password with token
 * @route POST /api/auth/reset-password/:token
 */
router.post('/reset-password/:token', authLimiter, async (req, res) => {
  try {
    const result = await authClient.resetPassword(req.params.token, req.body.password);
    
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

/**
 * Verify email with token
 * @route GET /api/auth/verify/:token
 */
router.get('/verify/:token', async (req, res) => {
  try {
    const result = await authClient.verifyEmail(req.params.token);
    
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

/**
 * Admin check endpoint for Nginx auth_request
 * @route GET /api/auth/admin-check
 */
router.get('/admin-check', verifyToken, rbac('system:*'), (req, res) => {
  // If middleware passes, user is authorized
  res.status(200).end();
});

/**
 * Get user security logs (admin only)
 * @route GET /api/auth/security-logs/:userId
 */
router.get('/security-logs/:userId', verifyToken, rbac('users:*'), async (req, res) => {
  try {
    // Get user logs (would call authClient in a real implementation)
    res.json({
      success: true,
      logs: []
    });
  } catch (error) {
    res.status(error.status || 500).json(error);
  }
});

module.exports = router;