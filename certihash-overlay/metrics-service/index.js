const express = require('express');
const morgan = require('morgan');
const { register, metrics, recordTransaction } = require('./metrics');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(morgan('dev'));

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Sample endpoint for transaction publishing
app.post('/publish', (req, res) => {
  const startTime = Date.now();
  
  // Simulate transaction processing
  setTimeout(() => {
    // Record the transaction with app ID and processing time
    const appId = req.body.app_id || 'default';
    const processingTime = Date.now() - startTime;
    recordTransaction(appId, processingTime);
    
    res.json({ 
      status: 'success', 
      txid: `sample-tx-${Date.now()}`,
      processingTime: processingTime
    });
  }, Math.random() * 100); // Random processing time for simulation
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Metrics service running on port ${PORT}`);
});