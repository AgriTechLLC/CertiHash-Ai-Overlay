import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';

const AnomalyDetectionPanel = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);

  const fetchAnomalies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/ai/anomalies?timeRange=${timeRange}`);
      setAnomalies(response.data);
    } catch (err) {
      setError('Failed to fetch anomalies. Please try again later.');
      console.error('Anomaly fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [timeRange]);

  const handleAnomalySelect = (anomaly) => {
    setSelectedAnomaly(anomaly);
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            AI-Detected Blockchain Anomalies
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="time-range-label">Time Range</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="1h">Last Hour</MenuItem>
                <MenuItem value="6h">Last 6 Hours</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
              </Select>
            </FormControl>
            
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />}
              onClick={fetchAnomalies}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : anomalies.length === 0 ? (
          <Alert severity="info">No anomalies detected in the selected time range.</Alert>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={selectedAnomaly ? 5 : 12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                {anomalies.length} anomalies detected
              </Typography>
              
              {anomalies.map((anomaly) => (
                <Card 
                  key={anomaly.id} 
                  sx={{ 
                    mb: 2, 
                    cursor: 'pointer',
                    border: selectedAnomaly?.id === anomaly.id ? '2px solid' : 'none',
                    borderColor: 'primary.main'
                  }}
                  onClick={() => handleAnomalySelect(anomaly)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <WarningIcon color={getSeverityColor(anomaly.severity)} />
                          {anomaly.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatTimestamp(anomaly.timestamp)}
                        </Typography>
                      </Box>
                      <Chip 
                        label={anomaly.severity} 
                        color={getSeverityColor(anomaly.severity)}
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {anomaly.description}
                    </Typography>
                    
                    <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {anomaly.tags && anomaly.tags.map((tag, idx) => (
                        <Chip key={idx} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Grid>
            
            {selectedAnomaly && (
              <Grid item xs={12} md={7}>
                <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    {selectedAnomaly.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip 
                      label={selectedAnomaly.severity} 
                      color={getSeverityColor(selectedAnomaly.severity)} 
                    />
                    <Typography variant="body2" color="text.secondary">
                      Detected at {formatTimestamp(selectedAnomaly.timestamp)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Detailed Analysis:
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 2 }} component="div">
                    <div dangerouslySetInnerHTML={{ __html: selectedAnomaly.detailedAnalysis }} />
                  </Typography>
                  
                  {selectedAnomaly.metrics && (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Affected Metrics:
                      </Typography>
                      <ul>
                        {selectedAnomaly.metrics.map((metric, idx) => (
                          <li key={idx}>
                            <Typography variant="body2">
                              {metric}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  
                  {selectedAnomaly.recommendation && (
                    <>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        AI Recommendation:
                      </Typography>
                      <Typography variant="body1" component="div">
                        <div dangerouslySetInnerHTML={{ __html: selectedAnomaly.recommendation }} />
                      </Typography>
                    </>
                  )}
                  
                  {selectedAnomaly.grafanaUrl && (
                    <Box sx={{ mt: 3 }}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        href={selectedAnomaly.grafanaUrl}
                        target="_blank"
                      >
                        View in Grafana
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grid>
            )}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default AnomalyDetectionPanel;