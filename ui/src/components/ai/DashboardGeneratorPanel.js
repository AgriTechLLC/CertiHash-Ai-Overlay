import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField,
  Button,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  IconButton,
  Tooltip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
import axios from 'axios';

const DashboardGeneratorPanel = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [description, setDescription] = useState('');
  const [dashboardType, setDashboardType] = useState('transactions');
  const [dashboardTitle, setDashboardTitle] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshInterval, setRefreshInterval] = useState('1m');
  const [dashboardPreview, setDashboardPreview] = useState(null);
  const [suggestedMetrics, setSuggestedMetrics] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [generatedDashboard, setGeneratedDashboard] = useState(null);

  const steps = ['Describe', 'Configure', 'Preview', 'Create'];

  const handleNext = () => {
    if (activeStep === 0) {
      generateDashboardSuggestions();
    } else if (activeStep === 2) {
      createDashboard();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const generateDashboardSuggestions = async () => {
    if (!description.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/ai/dashboard-suggestions', {
        description
      });
      
      setDashboardTitle(response.data.title || '');
      setDashboardType(response.data.type || 'transactions');
      setSuggestedMetrics(response.data.suggestedMetrics || []);
      setSelectedMetrics(response.data.suggestedMetrics || []);
      setDashboardPreview(response.data.preview || null);
      
      setActiveStep(1);
    } catch (err) {
      setError('Failed to generate dashboard suggestions. Please try again.');
      console.error('Dashboard suggestion error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!dashboardTitle.trim() || selectedMetrics.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/ai/dashboard-preview', {
        title: dashboardTitle,
        type: dashboardType,
        metrics: selectedMetrics,
        timeRange,
        refreshInterval
      });
      
      setDashboardPreview(response.data);
      setActiveStep(2);
    } catch (err) {
      setError('Failed to generate dashboard preview. Please try again.');
      console.error('Dashboard preview error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createDashboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/ai/create-dashboard', {
        title: dashboardTitle,
        type: dashboardType,
        metrics: selectedMetrics,
        timeRange,
        refreshInterval
      });
      
      setGeneratedDashboard(response.data);
      setActiveStep(3);
    } catch (err) {
      setError('Failed to create dashboard. Please try again.');
      console.error('Dashboard creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMetricToggle = (metric) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metric)) {
        return prev.filter(m => m !== metric);
      } else {
        return [...prev, metric];
      }
    });
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        ) : (
          <>
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Describe the dashboard you want to create
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Provide a detailed description of what you want to visualize. The AI will suggest metrics and visualizations based on your input.
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Dashboard Description"
                  placeholder="E.g., I need a dashboard to monitor transaction volume and fees with alerts for unusual activity. Include visualizations for TPS and confirmation times."
                  variant="outlined"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  sx={{ mb: 3 }}
                />
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  <Chip 
                    label="Transaction Monitoring" 
                    onClick={() => setDescription('A dashboard for monitoring BSV transaction volume, TPS, and fees with historical comparisons.')}
                    clickable
                  />
                  <Chip 
                    label="Security Analysis" 
                    onClick={() => setDescription('Security-focused dashboard for detecting unusual transaction patterns and potential anomalies in the BSV network.')}
                    clickable
                  />
                  <Chip 
                    label="Performance Metrics" 
                    onClick={() => setDescription('Performance dashboard showing block times, confirmation delays, and network health metrics for BSV.')}
                    clickable
                  />
                </Box>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    The AI will analyze your description and suggest the most relevant metrics and visualizations for your dashboard.
                  </Typography>
                </Alert>
              </Box>
            )}
            
            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Configure your dashboard
                </Typography>
                
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Dashboard Title"
                      variant="outlined"
                      value={dashboardTitle}
                      onChange={(e) => setDashboardTitle(e.target.value)}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="dashboard-type-label">Dashboard Type</InputLabel>
                      <Select
                        labelId="dashboard-type-label"
                        value={dashboardType}
                        label="Dashboard Type"
                        onChange={(e) => setDashboardType(e.target.value)}
                      >
                        <MenuItem value="transactions">Transaction Analysis</MenuItem>
                        <MenuItem value="performance">Performance Monitoring</MenuItem>
                        <MenuItem value="security">Security & Anomalies</MenuItem>
                        <MenuItem value="business">Business Intelligence</MenuItem>
                        <MenuItem value="custom">Custom</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="time-range-label">Default Time Range</InputLabel>
                      <Select
                        labelId="time-range-label"
                        value={timeRange}
                        label="Default Time Range"
                        onChange={(e) => setTimeRange(e.target.value)}
                      >
                        <MenuItem value="15m">Last 15 Minutes</MenuItem>
                        <MenuItem value="1h">Last Hour</MenuItem>
                        <MenuItem value="6h">Last 6 Hours</MenuItem>
                        <MenuItem value="24h">Last 24 Hours</MenuItem>
                        <MenuItem value="7d">Last 7 Days</MenuItem>
                        <MenuItem value="30d">Last 30 Days</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel id="refresh-interval-label">Refresh Interval</InputLabel>
                      <Select
                        labelId="refresh-interval-label"
                        value={refreshInterval}
                        label="Refresh Interval"
                        onChange={(e) => setRefreshInterval(e.target.value)}
                      >
                        <MenuItem value="10s">10 Seconds</MenuItem>
                        <MenuItem value="30s">30 Seconds</MenuItem>
                        <MenuItem value="1m">1 Minute</MenuItem>
                        <MenuItem value="5m">5 Minutes</MenuItem>
                        <MenuItem value="15m">15 Minutes</MenuItem>
                        <MenuItem value="30m">30 Minutes</MenuItem>
                        <MenuItem value="1h">1 Hour</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Suggested Metrics:
                </Typography>
                
                <List>
                  {suggestedMetrics.map((metric, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedMetrics.includes(metric)}
                          onChange={() => handleMetricToggle(metric)}
                        />
                      </ListItemIcon>
                      <ListItemText primary={metric} />
                      <Tooltip title="More information about this metric">
                        <IconButton edge="end">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </ListItem>
                  ))}
                </List>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={generatePreview}
                    disabled={!dashboardTitle.trim() || selectedMetrics.length === 0}
                  >
                    Generate Preview
                  </Button>
                </Box>
              </Box>
            )}
            
            {activeStep === 2 && dashboardPreview && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Dashboard Preview
                </Typography>
                
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      {dashboardPreview.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip label={`Type: ${dashboardPreview.type}`} color="primary" variant="outlined" />
                      <Chip label={`Time Range: ${timeRange}`} color="primary" variant="outlined" />
                      <Chip label={`Refresh: ${refreshInterval}`} color="primary" variant="outlined" />
                    </Box>
                    
                    {dashboardPreview.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {dashboardPreview.description}
                      </Typography>
                    )}
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Grid container spacing={2}>
                      {dashboardPreview.panels.map((panel, index) => (
                        <Grid item xs={12} md={6} key={index}>
                          <Paper 
                            variant="outlined" 
                            sx={{ 
                              p: 2, 
                              height: '200px', 
                              display: 'flex', 
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'background.paper'
                            }}
                          >
                            <DashboardIcon color="primary" sx={{ fontSize: 40, mb: 1, opacity: 0.7 }} />
                            <Typography variant="subtitle1" align="center" gutterBottom>
                              {panel.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" align="center">
                              {panel.description}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                    
                    {dashboardPreview.aiInsight && (
                      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                          AI Insights:
                        </Typography>
                        <Typography variant="body2">
                          {dashboardPreview.aiInsight}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}
            
            {activeStep === 3 && generatedDashboard && (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Dashboard successfully created!
                  </Typography>
                </Alert>
                
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {generatedDashboard.title}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Your dashboard has been created and is ready to use in Grafana.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        href={generatedDashboard.url}
                        target="_blank"
                        startIcon={<DashboardIcon />}
                      >
                        Open Dashboard
                      </Button>
                      
                      <Button 
                        variant="outlined"
                        startIcon={<EditIcon />}
                      >
                        Edit in Grafana
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button
                    variant="text"
                    onClick={() => {
                      setActiveStep(0);
                      setDescription('');
                      setDashboardTitle('');
                      setDashboardType('transactions');
                      setSuggestedMetrics([]);
                      setSelectedMetrics([]);
                      setDashboardPreview(null);
                      setGeneratedDashboard(null);
                    }}
                    startIcon={<AddIcon />}
                  >
                    Create Another Dashboard
                  </Button>
                  
                  <Button 
                    variant="text"
                    color="secondary"
                    startIcon={<HelpIcon />}
                    href="/documentation/dashboards"
                  >
                    Dashboard Documentation
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
        
        {activeStep !== 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0 || loading}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button 
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !description.trim()) ||
                (activeStep === 1 && (!dashboardTitle.trim() || selectedMetrics.length === 0)) ||
                loading
              }
            >
              {activeStep === steps.length - 2 ? 'Create' : 'Next'}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DashboardGeneratorPanel;