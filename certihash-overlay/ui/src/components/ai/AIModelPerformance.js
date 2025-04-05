import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Button,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';
import TimelineIcon from '@mui/icons-material/Timeline';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axios from 'axios';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`model-tabpanel-${index}`}
      aria-labelledby={`model-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `model-tab-${index}`,
    'aria-controls': `model-tabpanel-${index}`,
  };
}

const AIModelPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedTimeRange]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`/api/ai/model-performance?timeRange=${selectedTimeRange}`);
      setPerformanceData(response.data);
    } catch (err) {
      console.error('Error fetching model performance data:', err);
      setError('Failed to load AI model performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTimeRangeChange = (range) => {
    setSelectedTimeRange(range);
  };

  const renderOverviewTab = () => {
    if (!performanceData) return null;
    
    return (
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <MemoryIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="div">
                  {performanceData.totalModels}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Models
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <TimelineIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="div">
                  {performanceData.totalInteractions.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Interactions
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <AutoGraphIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="div">
                  {(performanceData.successRate * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <AccessTimeIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="div">
                  {performanceData.avgResponseTime.toFixed(2)}s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Response Time
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Model Usage Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Model Usage Breakdown
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell>Usage</TableCell>
                    <TableCell align="right">Interactions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceData.modelUsage.map((model) => (
                    <TableRow key={model.name}>
                      <TableCell>{model.name}</TableCell>
                      <TableCell width="60%">
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={model.percentage} 
                              sx={{ 
                                height: 10, 
                                borderRadius: 5,
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: model.color || 'primary.main'
                                }
                              }}
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                              {model.percentage}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{model.count.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        {/* Request Distribution by Type */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Request Types
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request Type</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Success Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceData.requestTypes.map((type) => (
                    <TableRow key={type.name}>
                      <TableCell>{type.name}</TableCell>
                      <TableCell align="right">{type.count.toLocaleString()}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: type.successRate >= 0.95 
                            ? 'success.main' 
                            : type.successRate >= 0.8 
                              ? 'warning.main' 
                              : 'error.main' 
                        }}
                      >
                        {(type.successRate * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        
        {/* Error Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Error Distribution
            </Typography>
            {performanceData.errors.length === 0 ? (
              <Alert severity="success">No errors in the selected time period</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Error Type</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performanceData.errors.map((error) => (
                      <TableRow key={error.type}>
                        <TableCell>{error.type}</TableCell>
                        <TableCell align="right">{error.count.toLocaleString()}</TableCell>
                        <TableCell align="right">{error.percentage.toFixed(2)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderModelDetailsTab = () => {
    if (!performanceData) return null;
    
    return (
      <Grid container spacing={3}>
        {performanceData.models.map((model) => (
          <Grid item xs={12} key={model.name}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">{model.name}</Typography>
                <Typography 
                  variant="subtitle1" 
                  color={model.status === 'active' ? 'success.main' : 'error.main'}
                >
                  {model.status}
                </Typography>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Response Time
                      </Typography>
                      <Typography variant="h5">
                        {model.responseTime.avg.toFixed(2)}s
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Min: {model.responseTime.min.toFixed(2)}s
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Max: {model.responseTime.max.toFixed(2)}s
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Success Rate
                      </Typography>
                      <Typography variant="h5">
                        {(model.successRate * 100).toFixed(1)}%
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Requests: {model.totalRequests.toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Usage Ratio
                      </Typography>
                      <Typography variant="h5">
                        {model.usageRatio.toFixed(1)}%
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Last 24h Trend: {model.usageTrend > 0 ? '+' : ''}{model.usageTrend.toFixed(1)}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    Top Request Types
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Request Type</TableCell>
                          <TableCell align="right">Count</TableCell>
                          <TableCell align="right">Success Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {model.topRequestTypes.map((type) => (
                          <TableRow key={type.name}>
                            <TableCell>{type.name}</TableCell>
                            <TableCell align="right">{type.count.toLocaleString()}</TableCell>
                            <TableCell 
                              align="right"
                              sx={{ 
                                color: type.successRate >= 0.95 
                                  ? 'success.main' 
                                  : type.successRate >= 0.8 
                                    ? 'warning.main' 
                                    : 'error.main' 
                              }}
                            >
                              {(type.successRate * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderUserFeedbackTab = () => {
    if (!performanceData || !performanceData.feedback) return null;
    
    const { feedback } = performanceData;
    
    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              User Satisfaction
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  bgcolor: 'background.paper', 
                  textAlign: 'center',
                  p: 2
                }}>
                  <Typography variant="h4" color="primary">
                    {feedback.averageRating.toFixed(1)}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Average Rating (out of 5)
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  bgcolor: 'background.paper', 
                  textAlign: 'center',
                  p: 2
                }}>
                  <Typography variant="h4" color="primary">
                    {feedback.feedbackCount.toLocaleString()}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Feedback Responses
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Card sx={{ 
                  bgcolor: 'background.paper', 
                  textAlign: 'center',
                  p: 2
                }}>
                  <Typography variant="h4" color="primary">
                    {(feedback.feedbackParticipationRate * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    Feedback Participation Rate
                  </Typography>
                </Card>
              </Grid>
            </Grid>
            
            <Typography variant="subtitle1" gutterBottom>
              Rating Distribution
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              {feedback.ratingDistribution.map((rating) => (
                <Box key={rating.value} sx={{ mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ minWidth: 70 }}>
                      {rating.value} Stars
                    </Typography>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={rating.percentage} 
                        sx={{ 
                          height: 10, 
                          borderRadius: 5,
                          backgroundColor: 'rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: rating.value >= 4 
                              ? 'success.main' 
                              : rating.value >= 3 
                                ? 'warning.main' 
                                : 'error.main'
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 50 }}>
                      <Typography variant="body2" color="text.secondary">
                        {rating.percentage}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
            
            <Typography variant="subtitle1" gutterBottom>
              Most Common Feedback Tags
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tag</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Average Rating</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {feedback.commonTags.map((tag) => (
                    <TableRow key={tag.name}>
                      <TableCell>{tag.name}</TableCell>
                      <TableCell align="right">{tag.count}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: tag.averageRating >= 4 
                            ? 'success.main' 
                            : tag.averageRating >= 3 
                              ? 'warning.main' 
                              : 'error.main' 
                        }}
                      >
                        {tag.averageRating.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">AI Model Performance</Typography>
          
          <Box>
            <Button 
              variant={selectedTimeRange === '24h' ? 'contained' : 'outlined'} 
              size="small"
              sx={{ mr: 1 }}
              onClick={() => handleTimeRangeChange('24h')}
            >
              24h
            </Button>
            <Button 
              variant={selectedTimeRange === '7d' ? 'contained' : 'outlined'} 
              size="small"
              sx={{ mr: 1 }}
              onClick={() => handleTimeRangeChange('7d')}
            >
              7d
            </Button>
            <Button 
              variant={selectedTimeRange === '30d' ? 'contained' : 'outlined'} 
              size="small"
              onClick={() => handleTimeRangeChange('30d')}
            >
              30d
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : performanceData ? (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="model performance tabs">
                <Tab label="Overview" {...a11yProps(0)} />
                <Tab label="Model Details" {...a11yProps(1)} />
                <Tab label="User Feedback" {...a11yProps(2)} />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              {renderOverviewTab()}
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              {renderModelDetailsTab()}
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              {renderUserFeedbackTab()}
            </TabPanel>
          </>
        ) : (
          <Alert severity="info">No performance data available for the selected time range.</Alert>
        )}
      </Paper>
    </Box>
  );
};

export default AIModelPerformance;