import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AlertsService } from '../src/alerts/alerts.service';
import { createTestApp, registerAndLogin, authHeader } from './test-utils';

describe('Medications (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let userId: string;
  let medicationId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ({ token, userId } = await registerAndLogin(app));
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a medication reminder', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/medications')
      .set(authHeader(token))
      .send({ medicationName: 'Paracetamol', dosage: '500mg', schedule: '08:00' })
      .expect(201);

    expect(res.body.id).toBeDefined();
    medicationId = res.body.id;
  });

  it('lists medications', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/medications')
      .set(authHeader(token))
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('updates medication active status', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/medications/${medicationId}`)
      .set(authHeader(token))
      .send({ isActive: false })
      .expect(200);

    expect(res.body.isActive).toBe(false);
  });

  it('creates MEDICATION alert via AlertsService with dedupe', async () => {
    const alertsService = app.get(AlertsService);

    const first = await alertsService.createMedicationReminder(userId, {
      medicationId,
      medicationName: 'Paracetamol',
      dosage: '500mg',
      schedule: '08:00',
    });
    expect(first).not.toBeNull();
    expect(first?.type).toBe('MEDICATION');
    expect(first?.severity).toBe('MEDIUM');

    const duplicate = await alertsService.createMedicationReminder(userId, {
      medicationId,
      medicationName: 'Paracetamol',
      dosage: '500mg',
      schedule: '08:00',
    });
    expect(duplicate).toBeNull();
  });

  it('deletes a medication', async () => {
    await request(app.getHttpServer())
      .delete(`/api/medications/${medicationId}`)
      .set(authHeader(token))
      .expect(200);
  });
});
