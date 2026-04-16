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
      'INSERT INTO apps(id, name, owner_email) VALUES($1, $2, $3)',
      [appId, name, email]
    );

    await pool.query(
      'INSERT INTO api_keys(id, app_id, key_hash, revoked) VALUES($1, $2, $3, false)',
      [uuid(), appId, hash]
    );

    res.json({ appId, apiKey });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/revoke', async (req, res) => {
  try {
    const { appId } = req.body;

    await pool.query(
      'UPDATE api_keys SET revoked = true WHERE app_id = $1',
      [appId]
    );

    res.json({ message: 'API key revoked' });
  } catch (err) {
    res.status(500).json({ message: 'Revoke failed' });
  }
});

module.exports = router;
