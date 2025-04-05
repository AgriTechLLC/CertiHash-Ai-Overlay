import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Rating, 
  TextField, 
  Chip,
  CircularProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axios from 'axios';

const FeedbackSystem = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelPerformance, setModelPerformance] = useState(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState({
    interactionId: '',
    rating: 0,
    comment: '',
    tags: []
  });
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
    fetchModelPerformance();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/ai/feedback');
      setFeedbacks(response.data);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const fetchModelPerformance = async () => {
    try {
      const response = await axios.get('/api/ai/model-performance');
      setModelPerformance(response.data);
    } catch (err) {
      console.error('Error fetching model performance:', err);
    }
  };

  const handleFeedbackOpen = (interactionId) => {
    setCurrentFeedback({
      interactionId,
      rating: 0,
      comment: '',
      tags: []
    });
    setFeedbackOpen(true);
  };

  const handleFeedbackClose = () => {
    setFeedbackOpen(false);
  };

  const handlePerformanceDialogOpen = () => {
    setPerformanceDialogOpen(true);
  };

  const handlePerformanceDialogClose = () => {
    setPerformanceDialogOpen(false);
  };

  const handleRatingChange = (event, newValue) => {
    setCurrentFeedback({...currentFeedback, rating: newValue});
  };

  const handleCommentChange = (event) => {
    setCurrentFeedback({...currentFeedback, comment: event.target.value});
  };

  const handleTagClick = (tag) => {
    if (currentFeedback.tags.includes(tag)) {
      setCurrentFeedback({
        ...currentFeedback, 
        tags: currentFeedback.tags.filter(t => t !== tag)
      });
    } else {
      setCurrentFeedback({
        ...currentFeedback, 
        tags: [...currentFeedback.tags, tag]
      });
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      await axios.post('/api/ai/feedback', currentFeedback);
      setFeedbackOpen(false);
      fetchFeedbacks();
      fetchModelPerformance();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback');
    }
  };

  const feedbackTags = [
    'Accurate', 'Inaccurate', 'Helpful', 'Unhelpful', 
    'Fast', 'Slow', 'Clear', 'Confusing', 'Relevant', 'Irrelevant'
  ];

  const renderModelPerformanceDialog = () => {
    if (!modelPerformance) return null;

    return (
      <Dialog
        open={performanceDialogOpen}
        onClose={handlePerformanceDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>AI Model Performance Metrics</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Overall Performance</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">30-Day Trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Average Rating</TableCell>
                    <TableCell align="right">{modelPerformance.averageRating.toFixed(2)}/5</TableCell>
                    <TableCell align="right" sx={{ 
                      color: modelPerformance.ratingTrend > 0 
                        ? 'success.main' 
                        : modelPerformance.ratingTrend < 0 
                          ? 'error.main' 
                          : 'text.primary' 
                    }}>
                      {modelPerformance.ratingTrend > 0 ? '+' : ''}{modelPerformance.ratingTrend.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Response Time</TableCell>
                    <TableCell align="right">{modelPerformance.responseTime.toFixed(2)}s</TableCell>
                    <TableCell align="right" sx={{ 
                      color: modelPerformance.responseTrend < 0 
                        ? 'success.main' 
                        : modelPerformance.responseTrend > 0 
                          ? 'error.main' 
                          : 'text.primary' 
                    }}>
                      {modelPerformance.responseTrend > 0 ? '+' : ''}{modelPerformance.responseTrend.toFixed(2)}s
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Query Success Rate</TableCell>
                    <TableCell align="right">{(modelPerformance.successRate * 100).toFixed(2)}%</TableCell>
                    <TableCell align="right" sx={{ 
                      color: modelPerformance.successTrend > 0 
                        ? 'success.main' 
                        : modelPerformance.successTrend < 0 
                          ? 'error.main' 
                          : 'text.primary' 
                    }}>
                      {modelPerformance.successTrend > 0 ? '+' : ''}{(modelPerformance.successTrend * 100).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>Performance by Model</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Model</TableCell>
                    <TableCell align="right">Rating</TableCell>
                    <TableCell align="right">Response Time</TableCell>
                    <TableCell align="right">Usage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modelPerformance.modelPerformance.map((model) => (
                    <TableRow key={model.name}>
                      <TableCell>{model.name}</TableCell>
                      <TableCell align="right">{model.rating.toFixed(2)}/5</TableCell>
                      <TableCell align="right">{model.responseTime.toFixed(2)}s</TableCell>
                      <TableCell align="right">{model.usage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>Common Feedback Tags</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {modelPerformance.feedbackTags.map((tag) => (
                <Chip 
                  key={tag.name}
                  label={`${tag.name} (${tag.count})`}
                  color={tag.sentiment === 'positive' ? 'success' : tag.sentiment === 'negative' ? 'error' : 'default'}
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePerformanceDialogClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">AI Feedback System</Typography>
          
          {modelPerformance && (
            <Button 
              variant="outlined" 
              startIcon={<TrendingUpIcon />}
              onClick={handlePerformanceDialogOpen}
            >
              Model Performance
            </Button>
          )}
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Your feedback helps improve the AI system. Rate your AI interactions and provide comments to enhance the system's performance.
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : feedbacks.length === 0 ? (
          <Alert severity="info">No feedback data available yet. Rate your AI interactions to help improve the system.</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Interaction Type</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedbacks.map((feedback) => (
                  <TableRow key={feedback.id}>
                    <TableCell>{feedback.interactionType}</TableCell>
                    <TableCell>{new Date(feedback.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{feedback.model}</TableCell>
                    <TableCell>
                      {feedback.rating ? (
                        <Rating value={feedback.rating} readOnly size="small" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not rated
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                        {feedback.tags?.map((tag, idx) => (
                          <Chip key={idx} label={tag} size="small" />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {!feedback.rating && (
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleFeedbackOpen(feedback.id)}
                        >
                          Rate
                        </Button>
                      )}
                      <Tooltip title="View Interaction Details">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onClose={handleFeedbackClose}>
        <DialogTitle>Rate AI Interaction</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Rate your experience:
            </Typography>
            <Rating
              value={currentFeedback.rating}
              onChange={handleRatingChange}
              size="large"
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Select relevant tags:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {feedbackTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onClick={() => handleTagClick(tag)}
                  color={currentFeedback.tags.includes(tag) ? 'primary' : 'default'}
                  clickable
                />
              ))}
            </Stack>
          </Box>
          
          <TextField
            label="Additional comments"
            multiline
            rows={4}
            fullWidth
            value={currentFeedback.comment}
            onChange={handleCommentChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFeedbackClose}>Cancel</Button>
          <Button 
            onClick={handleSubmitFeedback}
            variant="contained"
            disabled={currentFeedback.rating === 0}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Model Performance Dialog */}
      {renderModelPerformanceDialog()}
    </Box>
  );
};

export default FeedbackSystem;