import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import WarningIcon from '@mui/icons-material/Warning';
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import KeyIcon from '@mui/icons-material/Key';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import ErrorIcon from '@mui/icons-material/Error';
import axios from 'axios';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`security-log-tabpanel-${index}`}
      aria-labelledby={`security-log-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const SecurityLogsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: null,
    endDate: null,
    search: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [authLogs, setAuthLogs] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [alertLogs, setAlertLogs] = useState([]);

  useEffect(() => {
    fetchSecurityLogs();
  }, []);

  const fetchSecurityLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Multiple concurrent API calls for different log types
      const [securityResponse, authResponse, apiResponse, adminResponse, alertResponse] = await Promise.all([
        axios.get('/api/auth/security-logs'),
        axios.get('/api/auth/security-logs/auth'),
        axios.get('/api/auth/security-logs/api'),
        axios.get('/api/auth/security-logs/admin'),
        axios.get('/api/auth/security-logs/alerts')
      ]);
      
      setSecurityLogs(securityResponse.data.logs || []);
      setAuthLogs(authResponse.data.logs || []);
      setApiLogs(apiResponse.data.logs || []);
      setAdminLogs(adminResponse.data.logs || []);
      setAlertLogs(alertResponse.data.logs || []);
    } catch (err) {
      console.error('Error fetching security logs:', err);
      setError('Failed to load security logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleFilterChange = (key, value) => {
    setFilters({...filters, [key]: value});
  };
  
  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      startDate: null,
      endDate: null,
      search: ''
    });
  };
  
  const applyFilters = (logs) => {
    return logs.filter(log => {
      // Type filter
      if (filters.type && log.type !== filters.type) {
        return false;
      }
      
      // Status filter
      if (filters.status) {
        if (filters.status === 'success' && !log.successful) {
          return false;
        }
        if (filters.status === 'failure' && log.successful) {
          return false;
        }
      }
      
      // Date filters
      const logDate = new Date(log.timestamp);
      if (filters.startDate && logDate < filters.startDate) {
        return false;
      }
      if (filters.endDate) {
        // Include the entire end date
        const endDatePlus = new Date(filters.endDate);
        endDatePlus.setDate(endDatePlus.getDate() + 1);
        if (logDate > endDatePlus) {
          return false;
        }
      }
      
      // Search filter (IP, user, etc.)
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [
          log.ip,
          log.userId,
          log.userAgent,
          log.details
        ].filter(Boolean).map(field => field.toLowerCase());
        
        return searchableFields.some(field => field.includes(searchTerm));
      }
      
      return true;
    });
  };
  
  const getFilteredLogs = () => {
    switch (tabValue) {
      case 0:
        return applyFilters(securityLogs);
      case 1:
        return applyFilters(authLogs);
      case 2:
        return applyFilters(apiLogs);
      case 3:
        return applyFilters(adminLogs);
      case 4:
        return applyFilters(alertLogs);
      default:
        return [];
    }
  };
  
  const handleViewLog = (log) => {
    setSelectedLog(log);
    setShowLogDialog(true);
  };
  
  const handleExportLogs = () => {
    // Get the filtered logs based on current tab and filters
    const logsToExport = getFilteredLogs();
    
    // Convert logs to CSV format
    const headers = ['Timestamp', 'Type', 'Status', 'IP Address', 'User ID', 'Details'];
    const csvContent = [
      headers.join(','),
      ...logsToExport.map(log => [
        new Date(log.timestamp).toISOString(),
        log.type,
        log.successful ? 'Success' : 'Failure',
        log.ip || 'N/A',
        log.userId || 'N/A',
        log.details ? `"${log.details.replace(/"/g, '""')}"` : 'N/A'
      ].join(','))
    ].join('\n');
    
    // Create a downloadable blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and click it to start download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `security-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  const getTypeIcon = (type) => {
    switch (type) {
      case 'login':
      case 'logout':
      case 'password_change':
      case 'password_reset':
        return <LockIcon />;
      case 'api_key_generated':
      case 'api_key_revoked':
        return <KeyIcon />;
      case 'admin_action':
        return <SupervisorAccountIcon />;
      case 'security_alert':
        return <WarningIcon />;
      default:
        return <SecurityIcon />;
    }
  };
  
  const getStatusColor = (successful) => {
    return successful ? 'success' : 'error';
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0); // Reset to first page when changing tabs
  };
  
  const getCurrentTabName = () => {
    switch (tabValue) {
      case 0: return 'All Logs';
      case 1: return 'Authentication Logs';
      case 2: return 'API Logs';
      case 3: return 'Admin Logs';
      case 4: return 'Security Alerts';
      default: return '';
    }
  };
  
  const filteredLogs = getFilteredLogs();
  
  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            <SecurityIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Security Logs
          </Typography>
          
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={fetchSecurityLogs}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<FileDownloadIcon />}
              onClick={handleExportLogs}
              disabled={loading || filteredLogs.length === 0}
            >
              Export
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}
        
        {/* Filter Panel */}
        {showFilters && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Filter Logs
            </Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="log-type-label">Event Type</InputLabel>
                  <Select
                    labelId="log-type-label"
                    value={filters.type}
                    label="Event Type"
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="login">Login</MenuItem>
                    <MenuItem value="logout">Logout</MenuItem>
                    <MenuItem value="password_change">Password Change</MenuItem>
                    <MenuItem value="password_reset">Password Reset</MenuItem>
                    <MenuItem value="api_key_generated">API Key Generated</MenuItem>
                    <MenuItem value="api_key_revoked">API Key Revoked</MenuItem>
                    <MenuItem value="admin_action">Admin Action</MenuItem>
                    <MenuItem value="security_alert">Security Alert</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel id="log-status-label">Status</InputLabel>
                  <Select
                    labelId="log-status-label"
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="success">Success</MenuItem>
                    <MenuItem value="failure">Failure</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(date) => handleFilterChange('startDate', date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(date) => handleFilterChange('endDate', date)}
                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Search"
                  placeholder="Search by IP, User ID, or Details"
                  fullWidth
                  size="small"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: filters.search && (
                      <IconButton size="small" onClick={() => handleFilterChange('search', '')}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  onClick={resetFilters}
                  sx={{ mr: 1 }}
                >
                  Reset Filters
                </Button>
                
                <Button 
                  variant="contained"
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}
        
        {/* Tabs for different log types */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="security log tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              icon={<SecurityIcon />} 
              iconPosition="start" 
              label="All Logs" 
            />
            <Tab 
              icon={<LockIcon />} 
              iconPosition="start" 
              label="Authentication" 
            />
            <Tab 
              icon={<KeyIcon />} 
              iconPosition="start" 
              label="API Access" 
            />
            <Tab 
              icon={<SupervisorAccountIcon />} 
              iconPosition="start" 
              label="Admin Actions" 
            />
            <Tab 
              icon={<WarningIcon />} 
              iconPosition="start" 
              label="Security Alerts" 
            />
          </Tabs>
        </Box>
        
        {loading && !filteredLogs.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredLogs.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No {getCurrentTabName().toLowerCase()} found matching your filters.
          </Alert>
        ) : (
          <TabPanel value={tabValue} index={tabValue}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Event Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>IP Address</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((log, index) => (
                      <TableRow key={log.id || index}>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getTypeIcon(log.type)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {log.type.replace(/_/g, ' ')}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={log.successful ? 'Success' : 'Failed'} 
                            size="small"
                            color={getStatusColor(log.successful)}
                          />
                        </TableCell>
                        <TableCell>{log.ip || 'N/A'}</TableCell>
                        <TableCell>{log.userId || 'N/A'}</TableCell>
                        <TableCell>
                          {log.details ? (
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 250,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {log.details}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              No details
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleViewLog(log)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={filteredLogs.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </TabPanel>
        )}
      </Paper>
      
      {/* Log Details Dialog */}
      <Dialog
        open={showLogDialog}
        onClose={() => setShowLogDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {selectedLog && getTypeIcon(selectedLog.type)}
            <Typography variant="h6" sx={{ ml: 1 }}>
              {selectedLog?.type.replace(/_/g, ' ')} Event Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Timestamp
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {formatDate(selectedLog.timestamp)}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <Chip 
                    label={selectedLog.successful ? 'Success' : 'Failed'} 
                    size="small"
                    color={getStatusColor(selectedLog.successful)}
                  />
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  IP Address
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedLog.ip || 'N/A'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  User ID
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedLog.userId || 'N/A'}
                </Typography>
              </Grid>
              
              {selectedLog.userAgent && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    User Agent
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLog.userAgent}
                  </Typography>
                </Grid>
              )}
              
              {selectedLog.details && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Details
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, whiteSpace: 'pre-wrap', mt: 1 }}
                  >
                    {selectedLog.details}
                  </Paper>
                </Grid>
              )}
              
              {!selectedLog.successful && (
                <Grid item xs={12}>
                  <Alert 
                    severity="error"
                    icon={<ErrorIcon />}
                  >
                    <Typography variant="subtitle2">
                      Event Failed
                    </Typography>
                    <Typography variant="body2">
                      {selectedLog.errorMessage || 'No error details available'}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityLogsPanel;