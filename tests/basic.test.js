const request = require('supertest');
const app = require('../src/server');

describe('API Tests', () => {
  it('should fail without API key', async () => {
    const res = await request(app).post('/api/analytics/collect');
    expect(res.statusCode).toBe(401);
  });

  it('should register app', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'test', email: 'test@test.com' });

    expect(res.statusCode).toBe(200);
  });
});
