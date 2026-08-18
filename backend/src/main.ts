import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { gzipJsonMiddleware } from './common/gzip.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  // Body size limits — prevent oversized payload attacks
  app.use(json({ limit: '2mb' }));
  app.use(urlencoded({ limit: '2mb', extended: false }));

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );

  app.use(gzipJsonMiddleware());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      // Prevent prototype pollution via class-transformer
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean)
    ?? ['http://localhost:3000', 'http://localhost:8081'];
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HealthGuard API')
      .setDescription('API quản lý sức khỏe cá nhân tích hợp AI')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port).catch(async (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is busy — retrying in 2s...`);
      await new Promise((r) => setTimeout(r, 2000));
      await app.listen(port);
    } else {
      throw err;
    }
  });
  const server = app.getHttpServer() as { keepAliveTimeout?: number; headersTimeout?: number };
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  console.log(`HealthGuard API: http://localhost:${port}/api`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
