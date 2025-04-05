const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, restrictTo } = require('../middleware/auth');
const {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} = require('../middleware/validators');

// Public routes
router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', forgotPasswordValidator, authController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidator, authController.resetPassword);
router.get('/verify/:token', authController.verifyEmail);

// Protected routes
router.use(protect); // All routes below this line require authentication

router.get('/me', authController.getCurrentUser);
router.post('/logout', authController.logout);
router.post('/api-key', authController.generateApiKey);

// Admin only routes
router.get('/users', restrictTo('admin', 'superadmin'), (req, res) => {
  res.status(200).json({ message: 'Admin route for user listing' });
});

module.exports = router;