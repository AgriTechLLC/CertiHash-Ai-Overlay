import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Grid
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

// Import components
import GrafanaEmbed from './GrafanaEmbed';

/**
 * Component for displaying AI-detected anomalies
 */
const AnomalyAlerts = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const fetchAnomalies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/nlp/anomalies');
      setAnomalies(response.data.anomalies || generateFallbackAnomalies());
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching anomalies:', err);
      setAnomalies(generateFallbackAnomalies());
      setError('Failed to fetch live data. Showing sample data.');
      setLastUpdated(new Date());
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAnomalies();
    
    // Refresh every 5 minutes
    const intervalId = setInterval(fetchAnomalies, 300000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Generate fallback data when API is unavailable
  const generateFallbackAnomalies = () => {
    const now = new Date();
    
    return [
      {
        id: 'anom-001',
        timestamp: new Date(now.getTime() - 35 * 60000).toISOString(), // 35 minutes ago
        type: 'TPS Drop',
        severity: 'high',
        value: '203 TPS',
        details: 'Sudden 80% drop in transaction processing rate. Potential network issue.',
        appId: 'sentinel-node'
      },
      {
        id: 'anom-002',
        timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(), // 2 hours ago
        type: 'Volume Spike',
        severity: 'medium',
        value: '1.2M tx/hour',
        details: 'Unexpected transaction volume increase. 150% above normal for this time period.',
        appId: 'certihash-main'
      },
      {
        id: 'anom-003',
        timestamp: new Date(now.getTime() - 4 * 3600000).toISOString(), // 4 hours ago
        type: 'Processing Latency',
        severity: 'low',
        value: '850ms',
        details: 'Transaction processing time increased by 40%. Monitoring for further degradation.',
        appId: 'merchant-api'
      }
    ];
  };
  
  // Format timestamp to readable date/time
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
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
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        AI-Detected Anomalies
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1">
          LiteLLM-powered anomaly detection for CERTIHASH transaction patterns
        </Typography>
        
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />}
          onClick={fetchAnomalies}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {/* Anomalies table */}
            <Grid item xs={12}>
              <Paper sx={{ width: '100%', mb: 3 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>App</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {anomalies.length > 0 ? (
                        anomalies.map((anomaly) => (
                          <TableRow key={anomaly.id} hover>
                            <TableCell>{formatTimestamp(anomaly.timestamp)}</TableCell>
                            <TableCell>{anomaly.type}</TableCell>
                            <TableCell>{anomaly.appId}</TableCell>
                            <TableCell>{anomaly.value}</TableCell>
                            <TableCell>
                              <Chip 
                                label={anomaly.severity}
                                color={getSeverityColor(anomaly.severity)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{anomaly.details}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No anomalies detected in the current time window.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {lastUpdated && (
                  <Box sx={{ p: 2, borderTop: '1px solid rgba(81, 81, 81, 1)' }}>
                    <Typography variant="caption" color="text.secondary">
                      Last updated: {lastUpdated.toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            {/* Grafana dashboard */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Anomaly Detection Dashboard
                </Typography>
                <GrafanaEmbed 
                  dashboardUid="certihash-anomalies" 
                  height="600px"
                  timeRange="from=now-24h&to=now"
                />
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default AnomalyAlerts;