const { check } = require('express-validator');

/**
 * Validation for user registration
 */
exports.registerValidator = [
  check('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),
  
  check('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim(),
  
  check('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim(),
  
  check('organization')
    .notEmpty()
    .withMessage('Organization is required')
    .trim()
];

/**
 * Validation for user login
 */
exports.loginValidator = [
  check('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  check('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation for password reset request
 */
exports.forgotPasswordValidator = [
  check('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

/**
 * Validation for password reset
 */
exports.resetPasswordValidator = [
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character')
];