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

  // Enterprise CORS configuration: dynamically permit web portals and internal proxies
  app.enableCors({
    origin: (origin, callback) => {
      // Allow internal server-to-server rewrites, curl, mobile apps, or any browser origin
      return callback(null, true);
    },
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
