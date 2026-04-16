const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const redis = require('../config/redis');
const apiKeyMiddleware = require('../middleware/apiKey');

router.post('/collect', apiKeyMiddleware, async (req, res) => {
  try {
    const {
      event,
      url,
      referrer,
      device,
      userId,
      timestamp,
      metadata
    } = req.body;

    await pool.query(
      `INSERT INTO events 
      (app_id, event_name, url, referrer, device, user_id, timestamp, metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        req.appId,
        event,
        url,
        referrer,
        device,
        userId,
        timestamp,
        metadata
      ]
    );

    res.json({ message: 'Event collected' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to collect event' });
  }
});

router.get('/event-summary', apiKeyMiddleware, async (req, res) => {
  try {
    const { event, startDate, endDate } = req.query;

    const cacheKey = `summary:${req.appId}:${event}:${startDate}:${endDate}`;

    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const result = await pool.query(
      `SELECT 
        COUNT(*) AS count,
        COUNT(DISTINCT user_id) AS unique_users
      FROM events
      WHERE app_id = $1
      AND event_name = $2
      AND timestamp BETWEEN $3 AND $4`,
      [req.appId, event, startDate, endDate]
    );

    await redis.set(cacheKey, JSON.stringify(result.rows[0]), {
      EX: 300
    });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching summary' });
  }
});

router.get('/user-stats', apiKeyMiddleware, async (req, res) => {
  try {
    const { userId } = req.query;

    const result = await pool.query(
      `SELECT 
        COUNT(*) AS total_events,
        MAX(device) AS device
      FROM events
      WHERE user_id = $1`,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user stats' });
  }
});

module.exports = router;
