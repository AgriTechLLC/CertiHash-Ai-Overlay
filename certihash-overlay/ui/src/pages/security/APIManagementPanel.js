import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Grid, 
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import AddIcon from '@mui/icons-material/Add';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import axios from 'axios';

const APIManagementPanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState(null);
  const [newKeyData, setNewKeyData] = useState({
    description: '',
    expiryDays: 30,
    scopes: ['read']
  });
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [keyDetails, setKeyDetails] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/auth/api-keys');
      setApiKeys(response.data.apiKeys || []);
    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError('Failed to load API keys. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateKey = async () => {
    if (!newKeyData.description) {
      setError('Please provide a description for this API key');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/auth/api-key', newKeyData);
      
      // Add to keys list and display the newly created key
      setNewlyCreatedKey(response.data.apiKey);
      fetchApiKeys(); // Refresh the list
      
      // Reset form data
      setNewKeyData({
        description: '',
        expiryDays: 30,
        scopes: ['read']
      });
    } catch (err) {
      console.error('Error creating API key:', err);
      setError(err.response?.data?.message || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRevokeKey = async () => {
    if (!selectedKeyId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(`/api/auth/api-keys/${selectedKeyId}`);
      
      // Remove from state and close dialog
      setApiKeys(apiKeys.filter(key => key.id !== selectedKeyId));
      setShowConfirmDialog(false);
      setSuccess('API key revoked successfully');
    } catch (err) {
      console.error('Error revoking API key:', err);
      setError(err.response?.data?.message || 'Failed to revoke API key');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyKey = () => {
    if (newlyCreatedKey) {
      navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
      
      // Reset copied status after 3 seconds
      setTimeout(() => setCopied(false), 3000);
    }
  };
  
  const handleShowDetails = async (keyId) => {
    setLoading(true);
    
    try {
      const response = await axios.get(`/api/auth/api-keys/${keyId}`);
      setKeyDetails(response.data);
      setShowDetailsDialog(true);
    } catch (err) {
      console.error('Error fetching API key details:', err);
      setError(err.response?.data?.message || 'Failed to fetch API key details');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'expired':
        return 'error';
      case 'revoked':
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
            <VpnKeyIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            API Key Management
          </Typography>
          
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setShowNewKeyDialog(true)}
          >
            Create New API Key
          </Button>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        
        {newlyCreatedKey && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                startIcon={copied ? <CheckCircleIcon /> : <FileCopyIcon />}
                onClick={handleCopyKey}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            }
          >
            <Typography variant="subtitle2">
              New API Key Created:
            </Typography>
            <Typography
              variant="body2"
              sx={{ 
                fontFamily: 'monospace', 
                overflowX: 'auto', 
                whiteSpace: 'nowrap',
                bgcolor: 'background.paper',
                p: 1,
                borderRadius: 1,
                mt: 1
              }}
            >
              {newlyCreatedKey}
            </Typography>
            <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
              Save this key now! For security reasons, it won't be shown again.
            </Typography>
          </Alert>
        )}
        
        {loading && !apiKeys.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : !apiKeys.length ? (
          <Alert severity="info">
            No API keys found. Create a new API key to access the CERTIHASH API programmatically.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Description</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Scopes</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>{key.description}</TableCell>
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
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {key.scopes.map((scope) => (
                          <Chip 
                            key={scope} 
                            label={scope} 
                            size="small" 
                            variant="outlined" 
                          />
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {key.lastUsed ? formatDate(key.lastUsed) : 'Never'}
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Tooltip title="View Details">
                          <IconButton onClick={() => handleShowDetails(key.id)}>
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {key.status === 'active' && (
                          <Tooltip title="Revoke API Key">
                            <IconButton 
                              color="error"
                              onClick={() => {
                                setSelectedKeyId(key.id);
                                setShowConfirmDialog(true);
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            API Key Usage Guidelines
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Security Best Practices
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • Keep API keys secure and never expose them in client-side code<br />
                  • Use the least privileged scope needed for your application<br />
                  • Rotate keys regularly and revoke unused keys<br />
                  • Monitor API key usage for unusual activity
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Rate Limits
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  API keys are subject to the following rate limits:<br />
                  • 100 requests per minute for read operations<br />
                  • 30 requests per minute for write operations<br />
                  • 10 requests per minute for admin operations<br />
                  Exceeding these limits will result in HTTP 429 responses.
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Available Scopes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • read: Access to GET endpoints<br />
                  • write: Access to POST, PUT, DELETE endpoints<br />
                  • metrics: Access to metrics-related endpoints<br />
                  • ai: Access to AI-related endpoints<br />
                  • admin: Access to administrative endpoints (requires approval)
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Create New API Key Dialog */}
      <Dialog 
        open={showNewKeyDialog} 
        onClose={() => !loading && setShowNewKeyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <VpnKeyIcon sx={{ mr: 1 }} />
            Create New API Key
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={newKeyData.description}
            onChange={(e) => setNewKeyData({...newKeyData, description: e.target.value})}
            helperText="Provide a descriptive name for this API key"
            required
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="expiry-select-label">Expiration</InputLabel>
            <Select
              labelId="expiry-select-label"
              value={newKeyData.expiryDays}
              label="Expiration"
              onChange={(e) => setNewKeyData({...newKeyData, expiryDays: e.target.value})}
            >
              <MenuItem value={7}>7 days</MenuItem>
              <MenuItem value={30}>30 days</MenuItem>
              <MenuItem value={90}>90 days</MenuItem>
              <MenuItem value={365}>1 year</MenuItem>
            </Select>
            <FormHelperText>
              Choose how long this API key will be valid
            </FormHelperText>
          </FormControl>
          
          <FormControl fullWidth margin="normal">
            <InputLabel id="scopes-select-label">Access Scopes</InputLabel>
            <Select
              labelId="scopes-select-label"
              multiple
              value={newKeyData.scopes}
              label="Access Scopes"
              onChange={(e) => setNewKeyData({...newKeyData, scopes: e.target.value})}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="read">read</MenuItem>
              <MenuItem value="write">write</MenuItem>
              <MenuItem value="metrics">metrics</MenuItem>
              <MenuItem value="ai">ai</MenuItem>
              <MenuItem value="admin">admin</MenuItem>
            </Select>
            <FormHelperText>
              Select the permissions this key will have
            </FormHelperText>
          </FormControl>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            For security reasons, the API key will only be shown once after creation. Make sure to copy it immediately.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewKeyDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              handleCreateKey();
              setShowNewKeyDialog(false);
            }} 
            disabled={loading || !newKeyData.description}
          >
            Create API Key
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Revocation Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => !loading && setShowConfirmDialog(false)}
      >
        <DialogTitle>Confirm API Key Revocation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to revoke this API key? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Warning: Any applications or services using this key will immediately lose access.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleRevokeKey}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <BlockIcon />}
          >
            Revoke API Key
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Key Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>API Key Details</DialogTitle>
        <DialogContent>
          {keyDetails ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {keyDetails.description}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <Chip 
                    label={keyDetails.status} 
                    size="small"
                    color={getStatusColor(keyDetails.status)}
                  />
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(keyDetails.createdAt)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Expires
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(keyDetails.expiresAt)}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Scopes
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                  {keyDetails.scopes.map((scope) => (
                    <Chip 
                      key={scope} 
                      label={scope} 
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Usage Statistics
                </Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Total Requests</TableCell>
                        <TableCell align="right">{keyDetails.usage?.totalRequests || 0}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Last Used</TableCell>
                        <TableCell align="right">{keyDetails.lastUsed ? formatDate(keyDetails.lastUsed) : 'Never'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Last IP Address</TableCell>
                        <TableCell align="right">{keyDetails.usage?.lastIp || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Success Rate</TableCell>
                        <TableCell align="right">{keyDetails.usage?.successRate ? `${(keyDetails.usage.successRate * 100).toFixed(1)}%` : 'N/A'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              
              {keyDetails.usage?.topEndpoints && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Top Endpoints
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Endpoint</TableCell>
                          <TableCell align="right">Requests</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(keyDetails.usage.topEndpoints).map(([endpoint, count]) => (
                          <TableRow key={endpoint}>
                            <TableCell>{endpoint}</TableCell>
                            <TableCell align="right">{count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
          {keyDetails && keyDetails.status === 'active' && (
            <Button 
              color="error"
              onClick={() => {
                setSelectedKeyId(keyDetails.id);
                setShowDetailsDialog(false);
                setShowConfirmDialog(true);
              }}
            >
              Revoke Key
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default APIManagementPanel;