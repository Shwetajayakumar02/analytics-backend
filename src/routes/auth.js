const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { v4: uuid } = require('uuid');

router.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;

    const appId = uuid();
    const apiKey = uuid();
    const hash = await bcrypt.hash(apiKey, 10);

    await pool.query(
      'INSERT INTO apps(id, name, owner_email) VALUES($1,$2,$3)',
      [appId, name, email]
    );

    await pool.query(
      'INSERT INTO api_keys(id, app_id, key_hash, revoked, expires_at) VALUES($1,$2,$3,false, NOW() + INTERVAL \'30 days\')',
      [uuid(), appId, hash]
    );

    res.json({ appId, apiKey });
  } catch {
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.get('/api-key', async (req, res) => {
  try {
    const { appId } = req.query;

    const result = await pool.query(
      'SELECT * FROM api_keys WHERE app_id=$1 AND revoked=false',
      [appId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: 'No API key found' });
    }

    res.json({ message: 'API key exists (hidden)' });
  } catch {
    res.status(500).json({ message: 'Error fetching key' });
  }
});

router.post('/revoke', async (req, res) => {
  try {
    const { appId } = req.body;

    await pool.query(
      'UPDATE api_keys SET revoked=true WHERE app_id=$1',
      [appId]
    );

    res.json({ message: 'API key revoked' });
  } catch {
    res.status(500).json({ message: 'Revoke failed' });
  }
});

router.post('/regenerate', async (req, res) => {
  try {
    const { appId } = req.body;

    const newKey = uuid();
    const hash = await bcrypt.hash(newKey, 10);

    await pool.query('UPDATE api_keys SET revoked=true WHERE app_id=$1', [appId]);

    await pool.query(
      'INSERT INTO api_keys(id, app_id, key_hash, revoked) VALUES($1,$2,$3,false)',
      [uuid(), appId, hash]
    );

    res.json({ newApiKey: newKey });
  } catch {
    res.status(500).json({ message: 'Regenerate failed' });
  }
});

module.exports = router;
