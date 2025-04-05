import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper,
  CircularProgress,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  Chip
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import axios from 'axios';

const PredictiveAnalyticsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [metricType, setMetricType] = useState('transactions');
  const [timeWindow, setTimeWindow] = useState('24h');
  const [predictionHorizon, setPredictionHorizon] = useState('6h');

  const generatePrediction = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/ai/predictive-analytics', {
        metricType,
        timeWindow,
        predictionHorizon
      });
      
      setPredictions(response.data);
    } catch (err) {
      setError('Failed to generate predictions. Please try again later.');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          AI-Powered Predictive Analytics
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="metric-type-label">Metric Type</InputLabel>
              <Select
                labelId="metric-type-label"
                value={metricType}
                label="Metric Type"
                onChange={(e) => setMetricType(e.target.value)}
              >
                <MenuItem value="transactions">Transaction Volume</MenuItem>
                <MenuItem value="tps">Transactions Per Second</MenuItem>
                <MenuItem value="blockSize">Block Size</MenuItem>
                <MenuItem value="fees">Transaction Fees</MenuItem>
                <MenuItem value="confirmationTime">Confirmation Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="time-window-label">Historical Window</InputLabel>
              <Select
                labelId="time-window-label"
                value={timeWindow}
                label="Historical Window"
                onChange={(e) => setTimeWindow(e.target.value)}
              >
                <MenuItem value="6h">Last 6 Hours</MenuItem>
                <MenuItem value="24h">Last 24 Hours</MenuItem>
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="prediction-horizon-label">Prediction Horizon</InputLabel>
              <Select
                labelId="prediction-horizon-label"
                value={predictionHorizon}
                label="Prediction Horizon"
                onChange={(e) => setPredictionHorizon(e.target.value)}
              >
                <MenuItem value="1h">Next Hour</MenuItem>
                <MenuItem value="6h">Next 6 Hours</MenuItem>
                <MenuItem value="24h">Next 24 Hours</MenuItem>
                <MenuItem value="7d">Next 7 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        <Button 
          variant="contained" 
          color="primary"
          onClick={generatePrediction}
          disabled={loading}
          startIcon={<AnalyticsIcon />}
          sx={{ mb: 3 }}
        >
          {loading ? 'Analyzing...' : 'Generate Prediction'}
        </Button>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : predictions ? (
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimelineIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    Prediction Summary
                  </Typography>
                </Box>
                
                <Typography variant="body1" sx={{ mb: 2 }} component="div">
                  <div dangerouslySetInnerHTML={{ __html: predictions.summary }} />
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {predictions.tags?.map((tag, idx) => (
                    <Chip key={idx} label={tag} color="primary" variant="outlined" />
                  ))}
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Current Value
                      </Typography>
                      <Typography variant="h4">
                        {predictions.currentValue}
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          {predictions.unit}
                        </Typography>
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        bgcolor: predictions.trend === 'up' ? 'success.50' : 
                                predictions.trend === 'down' ? 'error.50' : 'background.paper'
                      }}
                    >
                      <Typography variant="subtitle2" color="text.secondary">
                        Predicted {predictionHorizon} Value
                      </Typography>
                      <Typography 
                        variant="h4"
                        color={predictions.trend === 'up' ? 'success.main' : 
                              predictions.trend === 'down' ? 'error.main' : 'text.primary'}
                      >
                        {predictions.predictedValue}
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          {predictions.unit}
                        </Typography>
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Detailed Analysis
                </Typography>
                
                <Typography variant="body1" component="div" sx={{ mb: 3 }}>
                  <div dangerouslySetInnerHTML={{ __html: predictions.analysis }} />
                </Typography>
                
                {predictions.factors && (
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Contributing Factors:
                    </Typography>
                    <ul>
                      {predictions.factors.map((factor, idx) => (
                        <li key={idx}>
                          <Typography variant="body2">
                            {factor}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}
                
                {predictions.grafanaUrl && (
                  <Box sx={{ mt: 3 }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      href={predictions.grafanaUrl}
                      target="_blank"
                    >
                      View in Grafana
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        ) : (
          <Alert severity="info">
            Select metrics and timeframes, then click "Generate Prediction" to analyze blockchain trends.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default PredictiveAnalyticsPanel;