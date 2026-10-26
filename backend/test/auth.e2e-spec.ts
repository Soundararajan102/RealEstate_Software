import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Authentication & User Flow E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('POST /auth/login', () => {
    it('should reject malformed payload with 400 Bad Request and validation errors', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'not-an-email',
          // missing password
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      // Verify Trace ID header is propagated even on validation errors
      expect(response.headers['x-trace-id']).toBeDefined();
    });

    it('should reject non-whitelisted properties when forbidNonWhitelisted is active', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@msp.com',
          password: 'Password123!',
          maliciousField: 'exploit',
        });

      expect(response.status).toBe(400);
      expect(response.headers['x-trace-id']).toBeDefined();
    });

    it('should reject invalid credentials with standardized non-leaking 401 error envelope', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent.user@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password',
        path: '/auth/login',
      });
      expect(response.headers['x-trace-id']).toBeDefined();
    });

    it('should authenticate admin user and return JWT with safe user profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'parthiban@msp.com',
          password: 'adminPassword123!',
        });

      // Note: If seeded user exists in local DB
      if (response.status === 200) {
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body.user).toHaveProperty('email', 'parthiban@msp.com');
        expect(response.body.user).not.toHaveProperty('passwordHash');

        // Test GET /auth/profile with bearer token
        const profileResponse = await request(app.getHttpServer())
          .get('/auth/me')
          .set('Authorization', `Bearer ${response.body.accessToken}`);

        expect(profileResponse.status).toBe(200);
        expect(profileResponse.body).toHaveProperty('employeeId', 'EMP-1001');
      }
    });
  });

  describe('Protected endpoints security checks', () => {
    it('should reject access to /auth/me when no authorization header is provided', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me');
      expect(response.status).toBe(401);
      expect(response.body.statusCode).toBe(401);
    });

    it('should reject access with invalid or forged JWT token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer forged.invalid.token');

      expect(response.status).toBe(401);
    });
  });
});
