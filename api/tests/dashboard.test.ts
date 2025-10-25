import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../src/app';
import { cleanDatabase, seedDatabase, closeDatabase } from './helpers/database';
import { testIssues } from './helpers/testData';

const app: Application = createApp();

describe('Dashboard API Endpoint', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/v1/dashboard', () => {
    test('should return dashboard counts with seeded data', async () => {
      await cleanDatabase();
      await seedDatabase(testIssues);

      const response = await request(app)
        .get('/api/v1/dashboard')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('statusCounts');
      expect(response.body).toHaveProperty('severityCounts');
      expect(response.body).toHaveProperty('totalIssues');

      // Check status counts (based on testIssues)
      expect(response.body.statusCounts).toEqual({
        open: 2,
        in_progress: 1,
        resolved: 1,
      });

      // Check severity counts (based on testIssues)
      expect(response.body.severityCounts).toEqual({
        minor: 1,
        major: 2,
        critical: 1,
      });

      // Check total
      expect(response.body.totalIssues).toBe(4);
    });

    test('should return zero counts when database is empty', async () => {
      await cleanDatabase();

      const response = await request(app).get('/api/v1/dashboard').expect(200);

      expect(response.body.statusCounts).toEqual({
        open: 0,
        in_progress: 0,
        resolved: 0,
      });

      expect(response.body.severityCounts).toEqual({
        minor: 0,
        major: 0,
        critical: 0,
      });

      expect(response.body.totalIssues).toBe(0);
    });

    test('should update counts after creating new issue', async () => {
      await cleanDatabase();

      // Create a new issue
      await request(app)
        .post('/api/v1/issues')
        .send({
          title: 'New Issue',
          description: 'Test description',
          site: 'Site-101',
          severity: 'critical',
          status: 'open',
        })
        .expect(201);

      // Check updated dashboard
      const response = await request(app).get('/api/v1/dashboard').expect(200);

      expect(response.body.statusCounts.open).toBe(1);
      expect(response.body.severityCounts.critical).toBe(1);
      expect(response.body.totalIssues).toBe(1);
    });

    test('should update counts after resolving an issue', async () => {
      await cleanDatabase();
      const issues = await seedDatabase([testIssues[0]!]); // Seed with one open issue

      // Initial check
      const initialResponse = await request(app).get('/api/v1/dashboard').expect(200);

      expect(initialResponse.body.statusCounts.open).toBe(1);
      expect(initialResponse.body.statusCounts.resolved).toBe(0);

      // Resolve the issue
      await request(app).patch(`/api/v1/issues/${issues[0]?.id}/resolve`).expect(200);

      // Check updated dashboard
      const updatedResponse = await request(app).get('/api/v1/dashboard').expect(200);

      expect(updatedResponse.body.statusCounts.open).toBe(0);
      expect(updatedResponse.body.statusCounts.resolved).toBe(1);
    });

    test('should update counts after deleting an issue', async () => {
      await cleanDatabase();
      const issues = await seedDatabase([testIssues[0]!]);

      // Initial check
      const initialResponse = await request(app).get('/api/v1/dashboard').expect(200);

      expect(initialResponse.body.totalIssues).toBe(1);

      // Delete the issue
      await request(app).delete(`/api/v1/issues/${issues[0]?.id}`).expect(204);

      // Check updated dashboard
      const updatedResponse = await request(app).get('/api/v1/dashboard').expect(200);

      expect(updatedResponse.body.totalIssues).toBe(0);
    });
  });
});
