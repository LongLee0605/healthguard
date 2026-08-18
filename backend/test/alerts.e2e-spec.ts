import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, registerAndLogin, authHeader } from './test-utils';

describe('Alerts (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let alertId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ({ token } = await registerAndLogin(app));

    await request(app.getHttpServer())
      .post('/api/vitals')
      .set(authHeader(token))
      .send({ type: 'BLOOD_SUGAR', value: 130 })
      .expect(201);

    const alerts = await request(app.getHttpServer())
      .get('/api/alerts')
      .set(authHeader(token))
      .expect(200);

    alertId = alerts.body[0]?.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists alerts', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/alerts')
      .set(authHeader(token))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('filters alerts since timestamp', async () => {
    const past = new Date(0).toISOString();
    const res = await request(app.getHttpServer())
      .get(`/api/alerts/since?after=${encodeURIComponent(past)}`)
      .set(authHeader(token))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns empty for future since timestamp', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app.getHttpServer())
      .get(`/api/alerts/since?after=${encodeURIComponent(future)}`)
      .set(authHeader(token))
      .expect(200);

    expect(res.body).toEqual([]);
  });

  it('marks alert as read', async () => {
    if (!alertId) return;
    await request(app.getHttpServer())
      .patch(`/api/alerts/${alertId}/read`)
      .set(authHeader(token))
      .expect(200);
  });

  it('marks all alerts as read', async () => {
    await request(app.getHttpServer())
      .patch('/api/alerts/read-all')
      .set(authHeader(token))
      .expect(200);

    const unread = await request(app.getHttpServer())
      .get('/api/alerts?unreadOnly=true')
      .set(authHeader(token))
      .expect(200);

    expect(unread.body).toEqual([]);
  });
});
