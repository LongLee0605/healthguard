import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp, registerAndLogin, authHeader } from './test-utils';

describe('AI (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    process.env.AI_PROVIDER = process.env.AI_PROVIDER || 'mock';
    app = await createTestApp();
    const auth = await registerAndLogin(app);
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/ai/analyze returns analysis', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ai/analyze')
      .set(authHeader(token))
      .send({ description: 'đau đầu nhẹ', severity: 5, bodyPart: 'đầu' })
      .expect(201);

    expect(res.body.analysis).toBeDefined();
    expect(res.body.urgencyLevel).toMatch(/LOW|MEDIUM|HIGH/);
    expect(res.body.suggestedSpecialty).toBeDefined();
  });

  it('POST /api/ai/chat returns reply', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/ai/chat')
      .set(authHeader(token))
      .send({ message: 'Tôi bị mệt mỏi, nên làm gì?' })
      .expect(201);

    expect(res.body.content).toBeDefined();
    expect(typeof res.body.content).toBe('string');
    expect(res.body.content.length).toBeGreaterThan(10);
  });

  it('GET /api/ai/weekly-insight returns summary', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/ai/weekly-insight')
      .set(authHeader(token))
      .expect(200);

    expect(res.body.insight).toBeDefined();
    expect(typeof res.body.insight).toBe('string');
  });
});
