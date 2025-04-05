const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * User schema for authentication
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't return password in queries by default
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
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user'
  },
  organization: {
    type: String,
    required: [true, 'Organization is required'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  apiKeyHash: {
    type: String,
    select: false
  },
  apiKeyExpiry: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  verificationToken: String,
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

/**
 * Hash password before saving
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password with hashed password
 * @param {string} candidatePassword - The password to verify
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Generate JWT token for user
 */
userSchema.methods.generateAuthToken = function() {
  // Generate access token
  const accessToken = jwt.sign(
    { 
      id: this._id,
      email: this.email,
      role: this.role,
      organization: this.organization
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );
  
  // Generate refresh token with longer expiry
  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
  
  return { accessToken, refreshToken };
};

/**
 * Generate API key for programmatic access
 */
userSchema.methods.generateApiKey = async function() {
  // Generate a random API key
  const apiKey = require('crypto').randomBytes(32).toString('hex');
  
  // Hash the API key for storage
  const salt = await bcrypt.genSalt(10);
  this.apiKeyHash = await bcrypt.hash(apiKey, salt);
  
  // Set expiry to 90 days in the future
  this.apiKeyExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  
  await this.save();
  
  return apiKey;
};

/**
 * Verify API key
 * @param {string} apiKey - The API key to verify
 */
userSchema.methods.verifyApiKey = async function(apiKey) {
  // Check if API key has expired
  if (this.apiKeyExpiry < Date.now()) {
    return false;
  }
  
  // Compare the provided API key with the stored hash
  return await bcrypt.compare(apiKey, this.apiKeyHash);
};

const User = mongoose.model('User', userSchema);

module.exports = User;