import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { StructuredLoggerService } from './common/logger/structured-logger.service';

async function bootstrap() {
  const logger = new StructuredLoggerService();
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed by reverse proxy or frontend CSP headers
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Enterprise CORS configuration
  const allowedOrigins: (string | RegExp)[] = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  ];

  if (process.env.FRONTEND_URL) {
    const urls = process.env.FRONTEND_URL.split(',').map((u) => u.trim());
    allowedOrigins.push(...urls);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-trace-id', 'x-idempotency-key'],
  });

  // Global prefix for all API routes
  app.setGlobalPrefix('api');

  // Strict Validation Pipe (Fail on unknown or malicious properties)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`MSP Real Estate Enterprise API initialized on port ${port}`, 'Bootstrap', {
    port,
    env: process.env.NODE_ENV || 'development',
  });
}

bootstrap();
