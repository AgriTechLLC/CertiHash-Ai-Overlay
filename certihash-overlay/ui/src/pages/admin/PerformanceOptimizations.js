import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  Button,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import SpeedIcon from '@mui/icons-material/Speed';
import StorageIcon from '@mui/icons-material/Storage';
import MemoryIcon from '@mui/icons-material/Memory';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CachedIcon from '@mui/icons-material/Cached';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

/**
 * Performance optimization dashboard for admins
 */
const PerformanceOptimizations = () => {
  const [loading, setLoading] = useState(true);
  const [cacheStats, setCacheStats] = useState(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [optimization, setOptimization] = useState(null);
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [slowQueries, setSlowQueries] = useState([]);
  const [slowQueriesLoading, setSlowQueriesLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch data in parallel
        await Promise.all([
          fetchCacheStats(),
          fetchOptimizationRecommendations(),
          fetchSlowQueries()
        ]);
        
      } catch (err) {
        console.error('Error fetching performance data:', err);
        setError('Failed to load performance data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Fetch cache statistics
  const fetchCacheStats = async () => {
    try {
      setCacheLoading(true);
      const response = await axios.get('/api/metrics/cache-stats');
      setCacheStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching cache stats:', err);
      setError('Failed to load cache statistics');
    } finally {
      setCacheLoading(false);
    }
  };
  
  // Fetch optimization recommendations
  const fetchOptimizationRecommendations = async () => {
    try {
      setOptimizationLoading(true);
      const response = await axios.get('/api/metrics/optimization');
      setOptimization(response.data);
    } catch (err) {
      console.error('Error fetching optimization recommendations:', err);
      setError('Failed to load optimization recommendations');
    } finally {
      setOptimizationLoading(false);
    }
  };
  
  // Fetch slow queries
  const fetchSlowQueries = async () => {
    try {
      setSlowQueriesLoading(true);
      const response = await axios.get('/api/metrics/slow-queries');
      setSlowQueries(response.data.slowQueries || []);
    } catch (err) {
      console.error('Error fetching slow queries:', err);
      setError('Failed to load slow queries');
    } finally {
      setSlowQueriesLoading(false);
    }
  };
  
  // Clear metrics cache
  const handleClearCache = async () => {
    try {
      setClearingCache(true);
      const response = await axios.post('/api/metrics/clear-cache');
      
      if (response.data.success) {
        // Refetch cache stats
        await fetchCacheStats();
      } else {
        setError('Failed to clear cache');
      }
    } catch (err) {
      console.error('Error clearing cache:', err);
      setError('Failed to clear cache');
    } finally {
      setClearingCache(false);
    }
  };
  
  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };
  
  // Format bytes to human-readable size
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };
  
  // Format seconds to human-readable time
  const formatTime = (seconds) => {
    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${minutes}m ${secs.toFixed(0)}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Performance Optimizations
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Cache Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Cache Statistics" 
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Refresh cache stats">
                    <IconButton 
                      onClick={fetchCacheStats} 
                      disabled={cacheLoading}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Clear cache">
                    <IconButton 
                      onClick={handleClearCache} 
                      disabled={clearingCache}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              avatar={<CachedIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              {cacheLoading ? (
                <LinearProgress />
              ) : cacheStats ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Memory Usage
                    </Typography>
                    <Typography variant="h6">
                      {cacheStats.memoryUsage}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Cached Keys
                    </Typography>
                    <Typography variant="h6">
                      {cacheStats.totalKeys.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Uptime
                    </Typography>
                    <Typography variant="h6">
                      {formatTime(cacheStats.uptime)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip 
                      label={cacheStats.connected ? "Connected" : "Disconnected"} 
                      color={cacheStats.connected ? "success" : "error"}
                      size="small"
                    />
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  No cache statistics available
                </Typography>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Redis is configured with LRU (Least Recently Used) eviction policy and 512MB maximum memory.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Prometheus Storage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Prometheus Storage Efficiency" 
              action={
                <Tooltip title="Refresh storage stats">
                  <IconButton 
                    onClick={fetchOptimizationRecommendations} 
                    disabled={optimizationLoading}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              }
              avatar={<StorageIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              {optimizationLoading ? (
                <LinearProgress />
              ) : optimization?.efficiency ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Series
                    </Typography>
                    <Typography variant="h6">
                      {optimization.efficiency.numSeries.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Samples
                    </Typography>
                    <Typography variant="h6">
                      {optimization.efficiency.numSamples.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Bytes per Sample
                    </Typography>
                    <Typography variant="h6">
                      {optimization.efficiency.bytesPerSample.toFixed(2)} bytes
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Head Chunks
                    </Typography>
                    <Typography variant="h6">
                      {optimization.efficiency.headChunks.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Storage Size
                    </Typography>
                    <Typography variant="h6">
                      {formatBytes(optimization.efficiency.totalBytes)}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  No storage efficiency data available
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Optimization Recommendations */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Optimization Recommendations" 
              avatar={<SpeedIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              {optimizationLoading ? (
                <LinearProgress />
              ) : optimization?.recommendations?.length > 0 ? (
                <List>
                  {optimization.recommendations.map((rec, index) => (
                    <ListItem key={index} divider={index < optimization.recommendations.length - 1}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={rec.severity} 
                              color={getSeverityColor(rec.severity)}
                              size="small"
                            />
                            <Typography variant="subtitle1">{rec.message}</Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {rec.details}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="success">
                  No optimization recommendations found. Your system is running optimally!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Slow Queries */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Slow Queries Analysis" 
              action={
                <Tooltip title="Refresh slow queries">
                  <IconButton 
                    onClick={fetchSlowQueries} 
                    disabled={slowQueriesLoading}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              }
              avatar={<ScheduleIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              {slowQueriesLoading ? (
                <LinearProgress />
              ) : slowQueries.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Query</TableCell>
                        <TableCell align="right">Execution Count</TableCell>
                        <TableCell align="right">Avg. Duration (s)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {slowQueries.map((query, index) => (
                        <TableRow key={index}>
                          <TableCell 
                            component="th" 
                            scope="row"
                            sx={{ 
                              maxWidth: '500px', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' 
                            }}
                          >
                            <Tooltip title={query.query}>
                              <span>{query.query}</span>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">
                            {query.count.toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'flex-end' 
                              }}
                            >
                              {query.avgDuration >= 1 && (
                                <WarningIcon 
                                  fontSize="small" 
                                  color="warning" 
                                  sx={{ mr: 1 }} 
                                />
                              )}
                              {query.avgDuration.toFixed(3)}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">
                  No slow queries detected
                </Typography>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Queries with execution time &gt; 1 second are marked as slow. Consider optimizing these queries or adding recording rules.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Optimization Settings */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Current Optimization Settings" 
              avatar={<MemoryIcon color="primary" />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Prometheus Optimizations
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="TSDB Retention Time" 
                        secondary="15 days"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Block Duration Range" 
                        secondary="2h - 6h"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Query Timeout" 
                        secondary="2 minutes"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Max Samples" 
                        secondary="50 million"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Recording Rules" 
                        secondary="Enabled (1m interval)"
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Redis Optimizations
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Eviction Policy" 
                        secondary="allkeys-lru (Least Recently Used)"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Max Memory" 
                        secondary="512MB"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Cache TTL (Default)" 
                        secondary="60 seconds"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Query Result Caching" 
                        secondary="Enabled"
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceOptimizations;