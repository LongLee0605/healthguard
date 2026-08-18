import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.setGlobalPrefix('api');
  await app.init();
  return app;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function registerAndLogin(app: INestApplication, suffix = Date.now()) {
  const email = `test${suffix}@healthguard.test`;
  const password = 'Test@12345';
  const fullName = 'Test User';

  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password, fullName })
    .expect(201);

  const loginRes = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);

  return {
    email,
    password,
    fullName,
    token: loginRes.body.accessToken as string,
    userId: loginRes.body.user.id as string,
  };
}
