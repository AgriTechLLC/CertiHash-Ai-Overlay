const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in query results by default
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  organization: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'analyst', 'admin', 'superadmin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  apiKey: {
    type: String,
    select: false
  },
  apiKeyExpiry: Date,
  apiKeyUsageCount: {
    type: Number,
    default: 0
  },
  lastApiKeyUsed: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    select: false
  },
  failedLogins: [{
    timestamp: Date,
    ip: String,
    userAgent: String
  }],
  securityEvents: [{
    type: {
      type: String,
      enum: ['password_change', 'login', 'logout', 'api_key_generated', '2fa_enabled', '2fa_disabled', 'password_reset']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ip: String,
    userAgent: String,
    successful: Boolean
  }]
}, {
  timestamps: true
});

// Pre-save hook to hash password before saving
UserSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Generate JWT tokens
UserSchema.methods.generateAuthToken = function() {
  // Generate access token
  const accessToken = jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  
  // Generate refresh token
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Generate API key
UserSchema.methods.generateApiKey = async function() {
  // Generate random API key
  const apiKey = crypto.randomBytes(32).toString('hex');
  
  // Set API key on user
  this.apiKey = apiKey;
  
  // Set expiry to 30 days from now
  this.apiKeyExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  // Reset usage count
  this.apiKeyUsageCount = 0;
  
  // Save user
  await this.save();
  
  // Record security event
  this.securityEvents.push({
    type: 'api_key_generated',
    timestamp: Date.now(),
    successful: true
  });
  
  return apiKey;
};

// Method to check if user account is locked
UserSchema.methods.isLocked = function() {
  // Check if account is locked
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to handle failed login attempts
UserSchema.methods.incrementLoginAttempts = async function(ip, userAgent) {
  // If previous lock has expired, reset login attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    // Increment login attempts
    this.loginAttempts += 1;
    
    // Record failed login
    this.failedLogins.push({
      timestamp: Date.now(),
      ip,
      userAgent
    });
    
    // Lock account if too many attempts (10)
    if (this.loginAttempts >= 10) {
      // Lock for 1 hour
      this.lockUntil = Date.now() + 60 * 60 * 1000;
    }
  }
  
  return this.save();
};

// Static method to find user by API key
UserSchema.statics.findByApiKey = async function(apiKey) {
  return this.findOne({
    apiKey,
    apiKeyExpiry: { $gt: Date.now() },
    isActive: true
  });
};

// Record security event
UserSchema.methods.recordSecurityEvent = async function(eventType, ip, userAgent, successful = true) {
  this.securityEvents.push({
    type: eventType,
    timestamp: Date.now(),
    ip,
    userAgent,
    successful
  });
  
  return this.save();
};

const User = mongoose.model('User', UserSchema);

module.exports = User;