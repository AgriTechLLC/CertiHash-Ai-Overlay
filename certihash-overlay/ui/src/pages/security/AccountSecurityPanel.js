import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Grid, 
  Switch, 
  FormControlLabel, 
  Divider, 
  Alert, 
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import PasswordIcon from '@mui/icons-material/Password';
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AccountSecurityPanel = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(currentUser?.twoFactorEnabled || false);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState(null);
  const [twoFactorQrCode, setTwoFactorQrCode] = useState(null);
  
  // Session management state
  const [activeSessions, setActiveSessions] = useState([]);
  const [showSessionsDialog, setShowSessionsDialog] = useState(false);
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      setSuccess('Password changed successfully');
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleTwoFactor = async () => {
    if (twoFactorEnabled) {
      // Disable 2FA
      try {
        setLoading(true);
        const response = await axios.post('/api/auth/disable-2fa');
        setTwoFactorEnabled(false);
        setSuccess('Two-factor authentication disabled');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to disable two-factor authentication');
      } finally {
        setLoading(false);
      }
    } else {
      // Enable 2FA - first step, get QR code
      try {
        setLoading(true);
        const response = await axios.get('/api/auth/setup-2fa');
        setTwoFactorSecret(response.data.secret);
        setTwoFactorQrCode(response.data.qrCode);
        setShowTwoFactorDialog(true);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to setup two-factor authentication');
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleVerifyTwoFactor = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/verify-2fa', {
        code: twoFactorCode,
        secret: twoFactorSecret
      });
      
      setTwoFactorEnabled(true);
      setShowTwoFactorDialog(false);
      setTwoFactorCode('');
      setSuccess('Two-factor authentication enabled successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGetActiveSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/active-sessions');
      setActiveSessions(response.data.sessions || []);
      setShowSessionsDialog(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch active sessions');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTerminateSession = async (sessionId) => {
    try {
      await axios.delete(`/api/auth/active-sessions/${sessionId}`);
      // Remove from local list
      setActiveSessions(activeSessions.filter(session => session.id !== sessionId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to terminate session');
    }
  };
  
  const handleTerminateAllSessions = async () => {
    try {
      await axios.delete('/api/auth/active-sessions');
      setActiveSessions([]);
      setShowSessionsDialog(false);
      setSuccess('All sessions terminated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to terminate all sessions');
    }
  };
  
  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          <SecurityIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Account Security
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ my: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ my: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Password Management Section */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                <PasswordIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Password Management
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                A strong password is essential for account security. Change your password regularly and never reuse passwords across different services.
              </Typography>
              
              <Box sx={{ mt: 2, mb: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setShowPasswordDialog(true)}
                  startIcon={<PasswordIcon />}
                >
                  Change Password
                </Button>
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Last password change: {currentUser?.lastPasswordChange ? new Date(currentUser.lastPasswordChange).toLocaleDateString() : 'Never'}
              </Typography>
            </Paper>
          </Grid>
          
          {/* Two-Factor Authentication Section */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                <LockIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Two-Factor Authentication
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                Two-factor authentication adds an extra layer of security to your account by requiring a code from your mobile device in addition to your password.
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={twoFactorEnabled} 
                    onChange={handleToggleTwoFactor}
                    disabled={loading}
                  />
                }
                label={twoFactorEnabled ? "Enabled" : "Disabled"}
              />
              
              {twoFactorEnabled && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Two-factor authentication is currently enabled for your account.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    onClick={handleToggleTwoFactor}
                    disabled={loading}
                  >
                    Disable 2FA
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Session Management Section */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                <SecurityIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
                Session Management
              </Typography>
              
              <Typography variant="body2" color="text.secondary" paragraph>
                View and manage active sessions. If you suspect unauthorized access, you can terminate all sessions and secure your account.
              </Typography>
              
              <Button 
                variant="outlined" 
                onClick={handleGetActiveSessions}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'View Active Sessions'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Password Change Dialog */}
      <Dialog 
        open={showPasswordDialog} 
        onClose={() => !loading && setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <form onSubmit={handlePasswordChange}>
          <DialogContent>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              margin="normal"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={loading}
            />
            
            <TextField
              label="New Password"
              type="password"
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              helperText="Must be at least 8 characters"
            />
            
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              error={newPassword !== confirmPassword && confirmPassword !== ''}
              helperText={newPassword !== confirmPassword && confirmPassword !== '' ? "Passwords don't match" : ""}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPasswordDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
            >
              {loading ? <CircularProgress size={24} /> : 'Change Password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Two-Factor Auth Setup Dialog */}
      <Dialog 
        open={showTwoFactorDialog} 
        onClose={() => !loading && setShowTwoFactorDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.) and enter the generated code below.
          </Typography>
          
          {twoFactorQrCode && (
            <Box sx={{ textAlign: 'center', my: 2 }}>
              <img 
                src={`data:image/png;base64,${twoFactorQrCode}`} 
                alt="QR Code for Two-Factor Authentication"
                style={{ maxWidth: 200 }}
              />
            </Box>
          )}
          
          <Typography variant="subtitle2">
            Manual setup code:
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'monospace', 
              backgroundColor: 'background.paper',
              p: 1, 
              borderRadius: 1
            }}
          >
            {twoFactorSecret}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <TextField
            label="Verification Code"
            fullWidth
            margin="normal"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            required
            disabled={loading}
            helperText="Enter the 6-digit code from your authenticator app"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTwoFactorDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleVerifyTwoFactor}
            disabled={loading || twoFactorCode.length !== 6}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify & Enable'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Active Sessions Dialog */}
      <Dialog 
        open={showSessionsDialog} 
        onClose={() => setShowSessionsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Active Sessions</DialogTitle>
        <DialogContent>
          {activeSessions.length === 0 ? (
            <Alert severity="info">
              No active sessions found other than your current session.
            </Alert>
          ) : (
            <Box>
              <Typography paragraph>
                These are the devices currently logged into your account. Your current session is marked as "Current".
              </Typography>
              
              {activeSessions.map((session) => (
                <Paper 
                  key={session.id} 
                  variant="outlined" 
                  sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <Box>
                    <Typography variant="subtitle1">
                      {session.deviceName} {session.current && "(Current)"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      IP: {session.ip} • Last active: {new Date(session.lastActive).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Browser: {session.userAgent}
                    </Typography>
                  </Box>
                  
                  {!session.current && (
                    <Button 
                      variant="outlined" 
                      color="error" 
                      size="small"
                      onClick={() => handleTerminateSession(session.id)}
                    >
                      Terminate
                    </Button>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSessionsDialog(false)}>
            Close
          </Button>
          {activeSessions.length > 0 && (
            <Button 
              variant="contained" 
              color="error"
              onClick={handleTerminateAllSessions}
            >
              Terminate All Other Sessions
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountSecurityPanel;