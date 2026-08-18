import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, registerAndLogin, authHeader } from './test-utils';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user', async () => {
    const email = `reg${Date.now()}@healthguard.test`;
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: 'Test@12345', fullName: 'New User' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it('logs in with valid credentials', async () => {
    const { email, password, token } = await registerAndLogin(app);
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('rejects invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'Wrong@1' })
      .expect(401);
  });

  it('returns 401 for protected route without token', async () => {
    await request(app.getHttpServer()).get('/api/users/me').expect(401);
  });

  it('returns profile with valid token', async () => {
    const { token, fullName } = await registerAndLogin(app);
    const res = await request(app.getHttpServer())
      .get('/api/users/me')
      .set(authHeader(token))
      .expect(200);

    expect(res.body.fullName).toBe(fullName);
  });
});
