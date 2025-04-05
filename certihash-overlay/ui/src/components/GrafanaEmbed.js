import React from 'react';
import { Box, CircularProgress, Typography, Paper } from '@mui/material';

/**
 * Component to embed Grafana dashboards via iframe
 * @param {Object} props - Component props
 * @param {string} props.dashboardUid - Grafana dashboard UID
 * @param {string} props.height - Height of the iframe (default: '400px')
 * @param {string} props.query - Optional query parameters for the dashboard
 * @param {string} props.timeRange - Optional time range (default: 'from=now-6h&to=now')
 */
const GrafanaEmbed = ({ 
  dashboardUid, 
  height = '400px',
  query = '',
  timeRange = 'from=now-6h&to=now'
}) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  
  // Get Grafana URL from environment or use default
  const grafanaUrl = process.env.REACT_APP_GRAFANA_URL || 'http://localhost:3000';
  
  // Construct full dashboard URL
  const dashboardUrl = `${grafanaUrl}/d/${dashboardUid}?${timeRange}&kiosk${query ? `&${query}` : ''}`;
  
  const handleIframeLoad = () => {
    setLoading(false);
  };
  
  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load dashboard. Please check your connection.');
  };
  
  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      {loading && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: 'background.paper'
          }}
        >
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Paper 
          sx={{ 
            p: 2, 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}
        >
          <Typography color="error">{error}</Typography>
        </Paper>
      )}
      
      <iframe
        title={`Grafana Dashboard - ${dashboardUid}`}
        src={dashboardUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        style={{ 
          backgroundColor: '#131313',
          borderRadius: '4px'
        }}
      />
    </Box>
  );
};

export default GrafanaEmbed;