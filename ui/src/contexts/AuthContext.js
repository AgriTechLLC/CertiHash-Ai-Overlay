import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// Create auth context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

/**
 * Authentication provider component
 */
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);
  
  // Load user on initial render if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Check if token is expired
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          // Token is expired, try to refresh
          await refreshToken();
        } else {
          // Token is valid, fetch user data
          const response = await axios.get('/api/auth/me');
          setCurrentUser(response.data.user);
        }
      } catch (err) {
        console.error('Error loading user:', err);
        setError('Session expired. Please log in again.');
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, [token]);
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   */
  const register = async (userData) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/register', userData);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };
  
  /**
   * Login a user
   * @param {Object} credentials - Login credentials
   */
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/login', credentials);
      
      // Set token and user state
      setToken(response.data.accessToken);
      setCurrentUser(response.data.user);
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.accessToken);
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };
  
  /**
   * Refresh access token
   */
  const refreshToken = async () => {
    try {
      const response = await axios.post('/api/auth/refresh-token');
      
      // Set new token
      setToken(response.data.accessToken);
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.accessToken);
      
      return response.data;
    } catch (err) {
      setError('Session expired. Please log in again.');
      logout();
      throw err;
    }
  };
  
  /**
   * Logout the current user
   */
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear state and localStorage
      setToken(null);
      setCurrentUser(null);
      localStorage.removeItem('token');
    }
  };
  
  /**
   * Request password reset
   * @param {string} email - User email
   */
  const forgotPassword = async (email) => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset');
      throw err;
    }
  };
  
  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {string} password - New password
   */
  const resetPassword = async (token, password) => {
    try {
      setError(null);
      const response = await axios.post(`/api/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
      throw err;
    }
  };
  
  /**
   * Generate API key
   */
  const generateApiKey = async () => {
    try {
      setError(null);
      const response = await axios.post('/api/auth/api-key');
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate API key');
      throw err;
    }
  };
  
  // Value object for the context provider
  const value = {
    currentUser,
    token,
    loading,
    error,
    register,
    login,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    generateApiKey,
    isAuthenticated: !!token
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};