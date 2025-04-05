import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Tabs, 
  Tab, 
  Paper
} from '@mui/material';
import SecurityDashboard from '../../components/SecurityDashboard';
import Layout from '../../components/Layout';
import AccountSecurityPanel from './AccountSecurityPanel';
import APIManagementPanel from './APIManagementPanel';
import SecurityLogsPanel from './SecurityLogsPanel';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`security-tabpanel-${index}`}
      aria-labelledby={`security-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `security-tab-${index}`,
    'aria-controls': `security-tabpanel-${index}`,
  };
}

const SecurityCenter = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Security Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage security settings for your CERTIHASH account
          </Typography>
        </Box>
        
        <Paper sx={{ width: '100%', mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="security tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Security Dashboard" {...a11yProps(0)} />
            <Tab label="Account Security" {...a11yProps(1)} />
            <Tab label="API Management" {...a11yProps(2)} />
            <Tab label="Security Logs" {...a11yProps(3)} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <SecurityDashboard />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <AccountSecurityPanel />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <APIManagementPanel />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <SecurityLogsPanel />
          </TabPanel>
        </Paper>
      </Container>
    </Layout>
  );
};

export default SecurityCenter;