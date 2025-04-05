import React, { useState } from 'react';
import { Box, Grid, Typography, Paper, Tab, Tabs } from '@mui/material';
import NLPQueryPanel from './NLPQueryPanel';
import AnomalyDetectionPanel from './AnomalyDetectionPanel';
import PredictiveAnalyticsPanel from './PredictiveAnalyticsPanel';
import DashboardGeneratorPanel from './DashboardGeneratorPanel';
import FeedbackSystem from './FeedbackSystem';
import AIModelPerformance from './AIModelPerformance';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
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
    id: `ai-tab-${index}`,
    'aria-controls': `ai-tabpanel-${index}`,
  };
}

const AIDashboard = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          AI Assistant Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Interact with the advanced AI capabilities to analyze blockchain transactions, detect anomalies,
          predict future trends, and generate custom dashboards.
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="AI assistant tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Natural Language Query" {...a11yProps(0)} />
            <Tab label="Anomaly Detection" {...a11yProps(1)} />
            <Tab label="Predictive Analytics" {...a11yProps(2)} />
            <Tab label="Dashboard Generator" {...a11yProps(3)} />
            <Tab label="Feedback System" {...a11yProps(4)} />
            <Tab label="Model Performance" {...a11yProps(5)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <NLPQueryPanel />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <AnomalyDetectionPanel />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <PredictiveAnalyticsPanel />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <DashboardGeneratorPanel />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <FeedbackSystem />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <AIModelPerformance />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AIDashboard;