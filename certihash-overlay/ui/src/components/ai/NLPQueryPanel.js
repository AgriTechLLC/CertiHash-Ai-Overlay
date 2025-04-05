import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Paper,
  Typography, 
  CircularProgress,
  Divider,
  Card,
  CardContent
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';

const NLPQueryPanel = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await axios.post('/api/ai/nlp-query', { query });
      setResponse(result.data);
      
      // Add to history
      setQueryHistory([
        { 
          query, 
          response: result.data,
          timestamp: new Date()
        },
        ...queryHistory
      ].slice(0, 10)); // Keep only last 10 queries
      
      setQuery('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process your query');
      console.error('NLP query error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (date) => {
    return new Date(date).toLocaleTimeString();
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ask about BSV transactions, metrics, or dashboards
        </Typography>
        
        <form onSubmit={handleQuerySubmit}>
          <TextField
            fullWidth
            label="Enter your question"
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., Show me unusual transaction patterns in the last 24 hours"
            sx={{ mb: 2 }}
            disabled={loading}
          />
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
            disabled={loading || !query.trim()}
          >
            {loading ? 'Processing...' : 'Ask AI'}
          </Button>
        </form>
        
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        
        {response && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Response:
            </Typography>
            
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography component="div">
                {response.answer && (
                  <div dangerouslySetInnerHTML={{ __html: response.answer }} />
                )}
              </Typography>
              
              {response.grafanaUrl && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">
                    View in Grafana:
                  </Typography>
                  <Button 
                    variant="outlined" 
                    href={response.grafanaUrl} 
                    target="_blank"
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Open Dashboard
                  </Button>
                </Box>
              )}
              
              {response.sources && response.sources.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">
                    Sources:
                  </Typography>
                  <ul>
                    {response.sources.map((source, index) => (
                      <li key={index}>
                        <Typography variant="body2">{source}</Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
            </Paper>
          </Box>
        )}
      </Paper>
      
      {queryHistory.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Recent Queries
          </Typography>
          
          {queryHistory.map((item, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {formatTimestamp(item.timestamp)}
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  Q: {item.query}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  A: {item.response.answer && (
                    <span dangerouslySetInnerHTML={{ 
                      __html: item.response.answer.length > 200 
                        ? item.response.answer.substring(0, 200) + '...' 
                        : item.response.answer 
                    }} />
                  )}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default NLPQueryPanel;