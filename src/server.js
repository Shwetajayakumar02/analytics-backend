const express = require('express');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');

const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000
});

app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('Analytics API Running');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

module.exports = app;
