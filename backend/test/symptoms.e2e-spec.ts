import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, registerAndLogin, authHeader } from './test-utils';

describe('Symptoms (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let symptomId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ({ token } = await registerAndLogin(app));
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a symptom', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/symptoms')
      .set(authHeader(token))
      .send({ description: 'Đau đầu', severity: 5, bodyPart: 'Đầu' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    symptomId = res.body.id;
  });

  it('lists symptoms', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/symptoms')
      .set(authHeader(token))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('updates a symptom', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/symptoms/${symptomId}`)
      .set(authHeader(token))
      .send({ severity: 7 })
      .expect(200);

    expect(res.body.severity).toBe(7);
  });

  it('deletes a symptom', async () => {
    await request(app.getHttpServer())
      .delete(`/api/symptoms/${symptomId}`)
      .set(authHeader(token))
      .expect(200);
  });
});
