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
  defaultMeta: { service: 'rbac' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/rbac-error.log', level: 'error' }),
    new transports.File({ filename: 'logs/rbac-combined.log' })
  ]
});

// Define role permissions
const rolePermissions = {
  // Basic user can only view their own data
  user: [
    'metrics:view',
    'dashboards:view',
    'transactions:view',
    'ai:query',
    'ai:anomaly:view',
    'ai:predict',
    'ai:feedback',
    'user:profile:view',
    'user:profile:edit'
  ],
  
  // Analysts have additional analytics permissions
  analyst: [
    'metrics:view',
    'dashboards:view',
    'dashboards:create',
    'dashboards:edit',
    'transactions:view',
    'ai:query',
    'ai:anomaly:view',
    'ai:anomaly:configure',
    'ai:predict',
    'ai:feedback',
    'ai:model-performance:view',
    'user:profile:view',
    'user:profile:edit'
  ],
  
  // Admin has full permissions
  admin: [
    'metrics:*',
    'dashboards:*',
    'transactions:*',
    'ai:*',
    'user:profile:*',
    'users:*',
    'system:*',
    'logs:*'
  ],
  
  // Super admin has unrestricted access
  superadmin: ['*']
};

/**
 * Check if user has the required permission
 * @param {string} permission - Required permission
 * @param {Array} userPermissions - User's permissions
 * @returns {boolean} - Whether the user has the permission
 */
function hasPermission(permission, userPermissions) {
  // Check for exact permission
  if (userPermissions.includes(permission)) {
    return true;
  }
  
  // Check for wildcard permissions
  const resourceType = permission.split(':')[0];
  if (userPermissions.includes(`${resourceType}:*`) || userPermissions.includes('*')) {
    return true;
  }
  
  return false;
}

/**
 * Get user permissions based on role
 * @param {string} role - User role
 * @returns {Array} - List of permissions
 */
function getUserPermissions(role) {
  if (!role || !rolePermissions[role]) {
    return rolePermissions.user; // Default to basic user permissions
  }
  
  return rolePermissions[role];
}

/**
 * Factory function to create RBAC middleware
 * @param {string|Array} requiredPermissions - Required permission(s)
 * @returns {Function} - Express middleware
 */
function rbac(requiredPermissions) {
  // Convert single permission to array
  const permissions = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Get user role and permissions
      const userRole = req.user.role || 'user';
      const userPermissions = getUserPermissions(userRole);
      
      // Check if user has all required permissions
      const hasAllPermissions = permissions.every(permission => 
        hasPermission(permission, userPermissions)
      );
      
      if (!hasAllPermissions) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          role: userRole,
          requiredPermissions: permissions,
          path: req.path,
          method: req.method
        });
        
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this resource'
        });
      }
      
      next();
    } catch (error) {
      logger.error(`RBAC error: ${error.message}`, {
        stack: error.stack,
        path: req.path
      });
      
      return res.status(500).json({
        success: false,
        message: 'Server error during permission check'
      });
    }
  };
}

module.exports = {
  rbac,
  getUserPermissions,
  hasPermission
};