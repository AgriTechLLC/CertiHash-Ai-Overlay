import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  Alert, 
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import KeyIcon from '@mui/icons-material/Key';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ShieldIcon from '@mui/icons-material/Shield';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import HttpsIcon from '@mui/icons-material/Https';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const SecurityDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [securityStats, setSecurityStats] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [newApiKey, setNewApiKey] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState(null);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use BatchTool to make multiple API calls concurrently
      const [statsResponse, apiKeysResponse, eventsResponse] = await Promise.all([
        axios.get('/api/auth/security-stats'),
        axios.get('/api/auth/api-keys'),
        axios.get('/api/auth/security-events')
      ]);

      setSecurityStats(statsResponse.data);
      setApiKeys(apiKeysResponse.data.apiKeys || []);
      setSecurityEvents(eventsResponse.data.events || []);
    } catch (err) {
      console.error('Error fetching security data:', err);
      setError('Failed to load security information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApiKey = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/auth/api-key');
      setNewApiKey(response.data.apiKey);
      setShowApiKeyDialog(true);
      
      // Refresh API keys list
      const keysResponse = await axios.get('/api/auth/api-keys');
      setApiKeys(keysResponse.data.apiKeys || []);
    } catch (err) {
      console.error('Error generating API key:', err);
      setError('Failed to generate API key. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!selectedApiKeyId) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/auth/api-keys/${selectedApiKeyId}`);
      
      // Refresh API keys list
      const keysResponse = await axios.get('/api/auth/api-keys');
      setApiKeys(keysResponse.data.apiKeys || []);
      
      setShowConfirmDialog(false);
    } catch (err) {
      console.error('Error deleting API key:', err);
      setError('Failed to delete API key. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeyDialogClose = () => {
    setShowApiKeyDialog(false);
    setNewApiKey(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'success':
      case 'secure':
        return 'success';
      case 'inactive':
      case 'failed':
      case 'warning':
        return 'warning';
      case 'expired':
      case 'error':
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Security Dashboard
          </Typography>
          
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={fetchSecurityData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}
        
        {loading && !securityStats ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Security Overview Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Account Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <ShieldIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="h6">
                        {securityStats?.accountStatus || 'Secure'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Last login: {formatDate(currentUser?.lastLogin || new Date())}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Active API Keys
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <KeyIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6">
                        {apiKeys.filter(key => key.status === 'active').length}
                      </Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<VpnKeyIcon />}
                      onClick={handleGenerateApiKey}
                      sx={{ mt: 1 }}
                    >
                      Generate New Key
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Security Alerts
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <WarningIcon 
                        color={securityStats?.alertCount > 0 ? 'warning' : 'success'} 
                        sx={{ mr: 1 }} 
                      />
                      <Typography variant="h6">
                        {securityStats?.alertCount || 0}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {securityStats?.alertCount > 0 
                        ? 'Review security alerts below' 
                        : 'No security alerts detected'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      TLS/SSL Status
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <HttpsIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="h6">
                        Secure
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      TLS 1.3, Strong Ciphers
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            
            {/* API Keys Section */}
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                <KeyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                API Keys
              </Typography>
              
              {apiKeys.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Key ID</TableCell>
                        <TableCell>Created</TableCell>
                        <TableCell>Expires</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Used</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {apiKeys.map((key) => (
                        <TableRow key={key.id}>
                          <TableCell>{key.id.substring(0, 8)}...</TableCell>
                          <TableCell>{formatDate(key.createdAt)}</TableCell>
                          <TableCell>{formatDate(key.expiresAt)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={key.status} 
                              size="small"
                              color={getStatusColor(key.status)}
                            />
                          </TableCell>
                          <TableCell>
                            {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Delete API Key">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => {
                                  setSelectedApiKeyId(key.id);
                                  setShowConfirmDialog(true);
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No API keys found. Generate a new key to access the API programmatically.
                </Alert>
              )}
            </Paper>
            
            {/* Security Events Section */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                <VerifiedUserIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Security Events
              </Typography>
              
              {securityEvents.length > 0 ? (
                <List>
                  {securityEvents.slice(0, 5).map((event, index) => (
                    <ListItem key={index} divider={index < securityEvents.length - 1}>
                      <ListItemIcon>
                        {event.type === 'login' ? <LockIcon color="primary" /> : 
                         event.type === 'password_change' ? <KeyIcon color="warning" /> :
                         event.type === 'api_key_generated' ? <VpnKeyIcon color="info" /> :
                         <SecurityIcon color={event.successful ? 'success' : 'error'} />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${event.type.replace('_', ' ')} (${event.successful ? 'Successful' : 'Failed'})`}
                        secondary={`${formatDate(event.timestamp)} - IP: ${event.ip || 'Unknown'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No security events recorded. Events will appear as you interact with the system.
                </Alert>
              )}
              
              {securityEvents.length > 5 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button variant="text" size="small">
                    View All Events
                  </Button>
                </Box>
              )}
            </Paper>
          </>
        )}
      </Paper>
      
      {/* API Key Dialog */}
      <Dialog 
        open={showApiKeyDialog} 
        onClose={handleApiKeyDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VpnKeyIcon sx={{ mr: 1 }} />
            API Key Generated
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Copy this API key now. It will only be shown once!
          </Alert>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              fontFamily: 'monospace', 
              wordBreak: 'break-all',
              bgcolor: 'background.default'
            }}
          >
            {newApiKey}
          </Paper>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            This API key grants access to the CERTIHASH API based on your user role.
            Protect it like a password and only use it in secure environments.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleApiKeyDialogClose}>Close</Button>
          <Button 
            variant="contained"
            onClick={() => {
              navigator.clipboard.writeText(newApiKey);
            }}
          >
            Copy to Clipboard
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogTitle>Confirm API Key Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this API key? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Any applications using this key will no longer be able to access the API.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteApiKey}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityDashboard;