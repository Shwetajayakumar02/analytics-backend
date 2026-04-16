const { createClient } = require('redis');

const client = createClient({
  url: 'redis://redis:6379'
});

client.connect();

module.exports = client;
