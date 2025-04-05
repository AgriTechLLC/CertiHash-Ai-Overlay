const helmet = require('helmet');
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
  defaultMeta: { service: 'security-headers' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/security-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/security-combined.log' })
  ]
});

/**
 * Apply security headers middleware
 * @returns {Function} - Express middleware
 */
function securityHeaders() {
  logger.info('Setting up security headers middleware');
  
  // Custom CSP for the application needs
  const contentSecurityPolicy = {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "grafana-domain.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "grafana-domain.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      connectSrc: ["'self'", "api.openai.com", "wss://grafana-domain.com"],
      frameSrc: ["'self'", "grafana-domain.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
    reportOnly: false
  };
  
  // Replace grafana-domain.com with actual domain in production
  if (process.env.NODE_ENV === 'production' && process.env.GRAFANA_DOMAIN) {
    const grafanaDomain = process.env.GRAFANA_DOMAIN;
    contentSecurityPolicy.directives.scriptSrc = contentSecurityPolicy.directives.scriptSrc.map(src => 
      src === 'grafana-domain.com' ? grafanaDomain : src
    );
    contentSecurityPolicy.directives.imgSrc = contentSecurityPolicy.directives.imgSrc.map(src => 
      src === 'grafana-domain.com' ? grafanaDomain : src
    );
    contentSecurityPolicy.directives.connectSrc = contentSecurityPolicy.directives.connectSrc.map(src => 
      src === 'wss://grafana-domain.com' ? `wss://${grafanaDomain}` : src
    );
    contentSecurityPolicy.directives.frameSrc = contentSecurityPolicy.directives.frameSrc.map(src => 
      src === 'grafana-domain.com' ? grafanaDomain : src
    );
  }
  
  return [
    // Apply helmet with custom configurations
    helmet({
      contentSecurityPolicy: contentSecurityPolicy,
      crossOriginEmbedderPolicy: false, // Allow embedding in iframes
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xssFilter: true,
    }),
    
    // Additional custom headers
    (req, res, next) => {
      // Cache control
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      
      // Strict transport security (only in production)
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      }
      
      // Set cookie security flags (if they're not already set)
      res.on('header', () => {
        const cookies = res.getHeader('Set-Cookie');
        if (cookies) {
          const securedCookies = Array.isArray(cookies) 
            ? cookies.map(secureCookie)
            : [secureCookie(cookies)];
          res.setHeader('Set-Cookie', securedCookies);
        }
      });
      
      next();
    }
  ];
}

/**
 * Helper function to secure cookies
 * @param {string} cookie - Cookie string
 * @returns {string} - Secured cookie string
 */
function secureCookie(cookie) {
  if (!cookie.includes('Secure') && process.env.NODE_ENV === 'production') {
    return cookie + '; Secure';
  }
  if (!cookie.includes('SameSite')) {
    return cookie + '; SameSite=Strict';
  }
  return cookie;
}

module.exports = securityHeaders;