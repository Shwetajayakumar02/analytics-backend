const pool = require('../config/db');
const bcrypt = require('bcrypt');

module.exports = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({ message: 'API key missing' });
    }

    const result = await pool.query(
      'SELECT * FROM api_keys WHERE revoked = false'
    );

    for (let row of result.rows) {
      const isValid = await bcrypt.compare(apiKey, row.key_hash);

      if (isValid) {
        if (row.expires_at && new Date() > row.expires_at) {
          return res.status(403).json({ message: 'API key expired' });
        }

        req.appId = row.app_id;
        return next();
      }
    }

    return res.status(403).json({ message: 'Invalid API key' });
  } catch (err) {
    return res.status(500).json({ message: 'Auth error' });
  }
};
