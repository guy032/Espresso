import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../src/app';
import { cleanDatabase, closeDatabase } from './helpers/database';

const app: Application = createApp();

describe('Health Check and Error Handling', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/health').expect('Content-Type', /json/).expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');

      // Verify timestamp is valid ISO string
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('404 Handler', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('path', '/api/v1/nonexistent');
      expect(response.body).toHaveProperty('method', 'GET');
    });

    test('should return 404 for wrong HTTP method', async () => {
      const response = await request(app)
        .patch('/api/v1/issues') // PATCH not supported on this endpoint
        .expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.method).toBe('PATCH');
    });
  });

  describe('CORS Headers', () => {
    test('should include CORS headers', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/issues')
        .expect((res) => {
          // Accept both 200 and 204 as valid responses for OPTIONS
          if (res.status !== 200 && res.status !== 204) {
            throw new Error(`Expected status 200 or 204, got ${res.status}`);
          }
        });

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Content Type Handling', () => {
    test('should accept JSON content type', async () => {
      const response = await request(app)
        .post('/api/v1/issues')
        .set('Content-Type', 'application/json')
        .send({
          title: 'Test',
          description: 'Test',
          site: 'Site-101',
          severity: 'major',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    test('should accept URL-encoded content type', async () => {
      const response = await request(app)
        .post('/api/v1/issues')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('title=Test&description=Test&site=Site-101&severity=major')
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Error Response Format', () => {
    test('should return consistent error format for validation errors', async () => {
      const response = await request(app)
        .post('/api/v1/issues')
        .send({}) // Empty body
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toBeInstanceOf(Array);
    });

    test('should return consistent error format for not found errors', async () => {
      const response = await request(app).get('/api/v1/issues/9999').expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Input Sanitization', () => {
    test('should handle special characters in input', async () => {
      const issueWithSpecialChars = {
        title: 'Test <script>alert("XSS")</script>',
        description: 'Test & Description with "quotes" and \'apostrophes\'',
        site: 'Site-101',
        severity: 'major',
      };

      const response = await request(app)
        .post('/api/v1/issues')
        .send(issueWithSpecialChars)
        .expect(201);

      // The data should be stored as-is (not HTML encoded at API level)
      // HTML encoding should happen at the frontend
      expect(response.body.title).toBe(issueWithSpecialChars.title);
      expect(response.body.description).toBe(issueWithSpecialChars.description);
    });

    test('should handle very long strings', async () => {
      const longTitle = 'a'.repeat(300); // Exceeds 255 character limit

      const response = await request(app)
        .post('/api/v1/issues')
        .send({
          title: longTitle,
          description: 'Test',
          site: 'Site-101',
          severity: 'major',
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(
        response.body.details.some(
          (d: any) => d.field === 'title' && d.message.includes('255 characters'),
        ),
      ).toBeTruthy();
    });

    test('should handle SQL injection attempts', async () => {
      const sqlInjectionAttempt = {
        title: "'; DROP TABLE issues; --",
        description: 'Test',
        site: 'Site-101',
        severity: 'major',
      };

      const response = await request(app)
        .post('/api/v1/issues')
        .send(sqlInjectionAttempt)
        .expect(201);

      // Should create issue safely (parameterized queries prevent SQL injection)
      expect(response.body.title).toBe(sqlInjectionAttempt.title);

      // Verify the issues table still exists
      const listResponse = await request(app).get('/api/v1/issues').expect(200);

      expect(listResponse.body).toBeInstanceOf(Array);
    });
  });
});
