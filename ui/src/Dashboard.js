import React, { useState, useEffect } from 'react';
import { Box, Grid, Typography, Paper, CircularProgress } from '@mui/material';
import axios from 'axios';

// Import components
import GrafanaEmbed from './components/GrafanaEmbed';
import TransactionCounter from './components/TransactionCounter';
import TpsGauge from './components/TpsGauge';
import ApplicationTable from './components/ApplicationTable';

const Dashboard = () => {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch available Grafana dashboards
  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const response = await axios.get('/api/dashboards');
        setDashboards(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboards:', err);
        setError('Failed to load dashboards. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDashboards();
  }, []);
  
  // Generate default dashboard URLs if API fails
  const defaultDashboards = [
    {
      uid: 'certihash-tx-volume',
      title: 'Transaction Volume',
      url: '/d/certihash-tx-volume/certihash-transaction-volume'
    },
    {
      uid: 'certihash-performance',
      title: 'Comparative Performance',
      url: '/d/certihash-performance/certihash-comparative-performance'
    },
    {
      uid: 'certihash-anomalies',
      title: 'Anomaly Alerts',
      url: '/d/certihash-anomalies/certihash-anomaly-alerts'
    }
  ];
  
  // Use fallback dashboards if API call failed
  const displayDashboards = dashboards.length > 0 ? dashboards : defaultDashboards;
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        CERTIHASH Prometheus Overlay
      </Typography>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.dark' }}>
          <Typography color="error.contrastText">{error}</Typography>
        </Paper>
      )}
      
      <Grid container spacing={3}>
        {/* Key metric cards */}
        <Grid item xs={12} md={4}>
          <TransactionCounter />
        </Grid>
        <Grid item xs={12} md={4}>
          <TpsGauge />
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Recent Record
            </Typography>
            <Typography variant="h3" component="p" sx={{ mt: 2, mb: 1 }}>
              17.7M
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Transactions on April 5, 2025
            </Typography>
          </Paper>
        </Grid>
        
        {/* Application table */}
        <Grid item xs={12}>
          <ApplicationTable />
        </Grid>
        
        {/* Grafana dashboards */}
        {displayDashboards.map((dashboard, index) => (
          <Grid item xs={12} key={dashboard.uid || index}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                {dashboard.title}
              </Typography>
              <GrafanaEmbed dashboardUid={dashboard.uid} height="400px" />
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;