const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'postgres',
  database: 'analytics',
  password: 'postgres',
  port: 5432
});

module.exports = pool;
