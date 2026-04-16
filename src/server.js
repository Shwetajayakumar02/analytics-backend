const express = require('express');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000
});

app.use(limiter);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('Analytics API Running');
});

app.listen(3000, () => console.log('Server running'));

module.exports = app;
