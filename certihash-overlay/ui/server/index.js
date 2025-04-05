const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const { createLogger, format, transports } = require('winston');

// Load environment variables
dotenv.config();

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
  defaultMeta: { service: 'ui-server' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/server-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/server-combined.log' })
  ]
});

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes
const nlpRouter = require('./nlp');
const authRouter = require('./routes/authRoutes');
const metricsRouter = require('./routes/metricsRoutes');
const aiRouter = require('./routes/aiRoutes');
const { verifyToken } = require('./auth');

// Import security middleware
const securityHeaders = require('./middleware/securityHeaders');
const { apiLimiter, authLimiter, aiLimiter, adminLimiter } = require('./middleware/rateLimiter');
const apiKeyAuth = require('./middleware/apiKeyAuth');
const { rbac } = require('./middleware/rbac');

// Request logging middleware with sensitive data masking
const requestLogger = morgan('combined', {
  skip: (req, res) => res.statusCode < 400, // Only log errors
  stream: {
    write: (message) => {
      // Mask sensitive data like tokens and API keys
      const maskedMessage = message
        .replace(/Bearer\s+[\w\.\-]+/g, 'Bearer [FILTERED]')
        .replace(/X-API-Key:\s+[\w\.\-]+/g, 'X-API-Key: [FILTERED]');
      logger.info(maskedMessage.trim());
    }
  }
});

// Middleware
app.use(express.json({ limit: '1mb' })); // Limit request body size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  maxAge: 86400, // Cache preflight requests for 24 hours
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(requestLogger);

// Apply security headers
app.use(...securityHeaders());

// Apply specific rate limits to different API endpoints
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);

// Auth routes - no authorization needed
app.use('/api/auth', authRouter);

// Combined authentication middleware (JWT or API key)
const authenticate = [
  (req, res, next) => {
    // Check for JWT first
    verifyToken(req, res, (err) => {
      if (!err) {
        return next(); // JWT authentication successful
      }
      // If JWT fails, try API key
      apiKeyAuth(req, res, next);
    });
  }
];

// Protected routes with role-based access control
app.use('/api/metrics', authenticate, rbac('metrics:view'), metricsRouter);
app.use('/api/ai', authenticate, rbac('ai:query'), aiRouter);
app.use('/api/nlp', authenticate, rbac('ai:query'), nlpRouter);

// Admin routes with stricter permissions
app.use('/api/admin', authenticate, rbac('users:manage'), adminLimiter, (req, res, next) => {
  logger.info(`Admin action by ${req.user.id}`, { 
    action: req.method,
    path: req.path
  });
  next();
});

// Proxy endpoint for Grafana dashboards - protected with authentication and RBAC
app.get('/api/dashboards', authenticate, rbac('dashboards:view'), async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get(`${process.env.GRAFANA_URL || 'http://grafana:3000'}/api/search`, {
      params: {
        query: 'certihash'
      },
      headers: {
        Authorization: `Bearer ${process.env.GRAFANA_API_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    logger.error(`Error fetching dashboards: ${error.message}`, { stack: error.stack });
    res.status(500).json({ error: 'Failed to fetch dashboards' });
  }
});

// Health check endpoint - no authentication needed
app.get('/api/health', (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV
  };
  
  res.json(health);
});

// System information - admin access required
app.get('/api/system', authenticate, rbac('system:view'), (req, res) => {
  const systemInfo = {
    cpu: process.cpuUsage(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    versions: process.versions,
    env: process.env.NODE_ENV
  };
  
  res.json(systemInfo);
});

// Public endpoint for basic API info
app.get('/api', (req, res) => {
  res.json({
    name: 'CERTIHASH AI Prometheus Overlay API',
    version: process.env.npm_package_version || '1.0.0',
    description: 'API for CERTIHASH Prometheus Overlay',
    capabilities: {
      metrics: '/api/metrics',
      ai: '/api/ai',
      nlp: '/api/nlp',
      auth: '/api/auth',
      dashboards: '/api/dashboards'
    }
  });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../src/build')));
  
  // Catch-all handler for React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/build', 'index.html'));
  });
}

// Advanced error handling middleware
app.use((err, req, res, next) => {
  // Log error details
  logger.error(`Server error: ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userId: req.user?.id
  });
  
  // Generate error reference ID for troubleshooting
  const errorId = require('crypto').randomBytes(8).toString('hex');
  
  // Send appropriate response based on error type
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      errorId,
      details: process.env.NODE_ENV === 'production' ? null : err.errors
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication error',
      errorId,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Authentication error',
      errorId,
      message: 'Token expired'
    });
  }
  
  // Default error response
  res.status(err.statusCode || 500).json({ 
    error: 'Server error',
    errorId,
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// 404 Not Found handler for undefined routes
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`, {
    ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
  });
  
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource at '${req.path}' was not found`
  });
});

// Start server with graceful shutdown
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force close if graceful shutdown fails
  setTimeout(() => {
    logger.error('Could not close connections in time. Forcefully shutting down');
    process.exit(1);
  }, 10000);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message}`, { stack: err.stack });
  
  // Gracefully shutdown on uncaught exceptions
  server.close(() => {
    logger.info('Server closed due to uncaught exception');
    process.exit(1);
  });
});