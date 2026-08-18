import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, registerAndLogin, authHeader } from './test-utils';

describe('Vitals (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let vitalId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ({ token } = await registerAndLogin(app));
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a vital sign', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/vitals')
      .set(authHeader(token))
      .send({ type: 'WEIGHT', value: 70, note: 'Test' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    vitalId = res.body.id;
  });

  it('creates high blood pressure and triggers VITAL_ANOMALY alert', async () => {
    await request(app.getHttpServer())
      .post('/api/vitals')
      .set(authHeader(token))
      .send({ type: 'BLOOD_PRESSURE', value: 150, valueSecondary: 95 })
      .expect(201);

    const alerts = await request(app.getHttpServer())
      .get('/api/alerts')
      .set(authHeader(token))
      .expect(200);

    const anomaly = alerts.body.find((a: { type: string }) => a.type === 'VITAL_ANOMALY');
    expect(anomaly).toBeDefined();
    expect(anomaly.severity).toBe('HIGH');
  });

  it('lists vitals', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/vitals')
      .set(authHeader(token))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('deletes a vital', async () => {
    await request(app.getHttpServer())
      .delete(`/api/vitals/${vitalId}`)
      .set(authHeader(token))
      .expect(200);
  });
});
