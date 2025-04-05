import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';

// Import components
import GrafanaEmbed from './components/GrafanaEmbed';

const NlpQuery = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Example queries for user guidance
  const exampleQueries = [
    "Show me CERTIHASH transaction volume by app",
    "What was the peak TPS yesterday?",
    "Compare CERTIHASH performance with Bitcoin Core",
    "Show me any transaction anomalies from the last 24 hours",
    "What's the forecast for transaction volume next week?"
  ];
  
  // Handle query submission
  const handleQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/nlp/query', { query });
      setResult(response.data);
    } catch (err) {
      console.error('Error processing query:', err);
      setError('Failed to process your query. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle example query selection
  const handleExampleQuery = (example) => {
    setQuery(example);
  };
  
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Natural Language Query
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="body1" paragraph>
          Ask questions about CERTIHASH data in plain English. The AI will interpret your question and provide relevant visualizations and answers.
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Ask about CERTIHASH data"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
            sx={{ mr: 2 }}
          />
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleQuery}
            disabled={loading || !query.trim()}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
          >
            {loading ? 'Processing' : 'Ask'}
          </Button>
        </Box>
        
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          Example queries:
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {exampleQueries.map((example, index) => (
            <Button 
              key={index}
              variant="outlined"
              size="small"
              onClick={() => handleExampleQuery(example)}
            >
              {example}
            </Button>
          ))}
        </Box>
      </Paper>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.dark' }}>
          <Typography color="error.contrastText">{error}</Typography>
        </Paper>
      )}
      
      {result && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Results
          </Typography>
          
          <Divider sx={{ mb: 2 }} />
          
          {/* Display natural language response */}
          {result.response && (
            <Typography variant="body1" paragraph>
              {result.response}
            </Typography>
          )}
          
          {/* Display Prometheus query if available */}
          {result.prometheusQuery && (
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Prometheus Query</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" component="pre" sx={{ 
                  p: 1, 
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  overflowX: 'auto'
                }}>
                  {result.prometheusQuery}
                </Typography>
              </AccordionDetails>
            </Accordion>
          )}
          
          {/* Display dashboard if available */}
          {result.dashboardUid && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Dashboard
              </Typography>
              <GrafanaEmbed 
                dashboardUid={result.dashboardUid} 
                height="500px"
                query={result.dashboardQuery || ''}
              />
            </Box>
          )}
          
          {/* Display chart data if available */}
          {result.chartData && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Data Visualization
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.paper' }}>
                {/* Chart visualization would be implemented here */}
                <Typography variant="body2">
                  Chart visualization based on data
                </Typography>
              </Paper>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default NlpQuery;