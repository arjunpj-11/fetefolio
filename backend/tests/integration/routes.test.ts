import type { Server } from 'node:http';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('HTTP route integration', () => {
  let server: Server;

  beforeAll(
    () =>
      new Promise<void>((resolve, reject) => {
        server = app.listen(0, '127.0.0.1', (error?: Error) => (error ? reject(error) : resolve()));
      }),
  );

  afterAll(
    () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  );

  it('returns a consistent health response', async () => {
    const response = await request(server).get('/api/health').expect(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Fetefolio API is ready',
      data: { status: 'ok' },
    });
  });

  it('normalizes the configured browser origin for CORS', async () => {
    const response = await request(server)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173')
      .expect(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('validates auth registration before persistence', async () => {
    const response = await request(server)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'bad', password: 'short' })
      .expect(400);
    expect(response.body).toMatchObject({
      success: false,
      data: null,
      message: 'Validation failed',
    });
  });

  it('validates the registration OTP before accessing Redis', async () => {
    const response = await request(server)
      .post('/api/auth/verify-registration')
      .send({ email: 'guest@example.com', otp: '12x' })
      .expect(400);
    expect(response.body).toMatchObject({
      success: false,
      data: null,
      message: 'Validation failed',
    });
  });

  it('validates service identifiers at the route boundary', async () => {
    const response = await request(server).get('/api/services/not-an-id').expect(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('protects service creation', async () => {
    await request(server).post('/api/services').send({}).expect(401);
  });

  it('returns centralized 404 responses', async () => {
    const response = await request(server).get('/api/unknown').expect(404);
    expect(response.body).toMatchObject({ success: false, data: null });
  });
});
