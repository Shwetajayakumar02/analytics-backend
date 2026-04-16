const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const redis = require('../config/redis');
const apiKeyMiddleware = require('../middleware/apiKey');

router.post('/collect', apiKeyMiddleware, async (req, res) => {
  try {
    const { event, url, referrer, device, userId, ipAddress, timestamp, metadata } = req.body;

    await pool.query(
      `INSERT INTO events 
      (app_id,event_name,url,referrer,device,user_id,ip_address,timestamp,metadata)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [req.appId, event, url, referrer, device, userId, ipAddress, timestamp, metadata]
    );

    res.json({ message: 'Event collected' });
  } catch {
    res.status(500).json({ message: 'Failed to collect event' });
  }
});

router.get('/event-summary', apiKeyMiddleware, async (req, res) => {
  try {
    const { event, startDate, endDate } = req.query;

    const cacheKey = `summary:${req.appId}:${event}:${startDate}:${endDate}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const summary = await pool.query(
      `SELECT COUNT(*) AS count, COUNT(DISTINCT user_id) AS unique_users
       FROM events WHERE app_id=$1 AND event_name=$2 AND timestamp BETWEEN $3 AND $4`,
      [req.appId, event, startDate, endDate]
    );

    const devices = await pool.query(
      `SELECT device, COUNT(*) FROM events
       WHERE app_id=$1 AND event_name=$2 AND timestamp BETWEEN $3 AND $4
       GROUP BY device`,
      [req.appId, event, startDate, endDate]
    );

    const deviceData = {};
    devices.rows.forEach(d => deviceData[d.device] = parseInt(d.count));

    const response = {
      event,
      count: parseInt(summary.rows[0].count),
      uniqueUsers: parseInt(summary.rows[0].unique_users),
      deviceData
    };

    await redis.set(cacheKey, JSON.stringify(response), { EX: 300 });

    res.json(response);
  } catch {
    res.status(500).json({ message: 'Error' });
  }
});

router.get('/user-stats', apiKeyMiddleware, async (req, res) => {
  try {
    const { userId } = req.query;

    const stats = await pool.query(
      `SELECT COUNT(*) as total, MAX(ip_address) as ip FROM events WHERE user_id=$1`,
      [userId]
    );

    const recent = await pool.query(
      `SELECT event_name, device, timestamp FROM events
       WHERE user_id=$1 ORDER BY timestamp DESC LIMIT 5`,
      [userId]
    );

    res.json({
      userId,
      totalEvents: parseInt(stats.rows[0].total),
      ipAddress: stats.rows[0].ip,
      recentEvents: recent.rows
    });
  } catch {
    res.status(500).json({ message: 'Error' });
  }
});

module.exports = router;
