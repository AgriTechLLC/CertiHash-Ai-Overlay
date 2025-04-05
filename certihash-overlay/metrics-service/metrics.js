const client = require('prom-client');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, memory usage, etc.)
client.collectDefaultMetrics({ register });

// Define custom metrics for CERTIHASH
const txCounter = new client.Counter({
  name: 'certihash_transactions_total',
  help: 'Total number of transactions published',
  labelNames: ['app_id']
});

const txProcessingTime = new client.Histogram({
  name: 'certihash_tx_processing_time',
  help: 'Transaction processing time in milliseconds',
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
});

const tpsGauge = new client.Gauge({
  name: 'certihash_tps',
  help: 'Current transactions per second'
});

// Register all metrics
register.registerMetric(txCounter);
register.registerMetric(txProcessingTime);
register.registerMetric(tpsGauge);

// TPS calculation variables
let txCount = 0;
let lastCalculated = Date.now();

// Calculate TPS every second
setInterval(() => {
  const now = Date.now();
  const elapsed = (now - lastCalculated) / 1000;
  if (elapsed > 0) {
    const currentTps = txCount / elapsed;
    tpsGauge.set(currentTps);
    txCount = 0;
    lastCalculated = now;
  }
}, 1000);

// Export metrics and functions
module.exports = {
  register,
  metrics: {
    txCounter,
    txProcessingTime,
    tpsGauge
  },
  recordTransaction: (appId = 'default', processingTime = 0) => {
    txCounter.inc({ app_id: appId });
    txProcessingTime.observe(processingTime);
    txCount++;
  }
};