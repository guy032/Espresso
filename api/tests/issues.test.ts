import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../src/app';
import { cleanDatabase, seedDatabase, closeDatabase } from './helpers/database';
import { createTestIssue, testIssues, invalidIssues } from './helpers/testData';
import type { Issue } from '../src/types/index';

const app: Application = createApp();

describe('Issues API Endpoints', () => {
  let seededIssues: Issue[] = [];

  beforeAll(async () => {
    await cleanDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
    seededIssues = await seedDatabase(testIssues);
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /api/v1/issues', () => {
    test('should return all issues', async () => {
      const response = await request(app)
        .get('/api/v1/issues')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(4);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('createdAt');
    });

    test('should filter issues by status', async () => {
      const response = await request(app).get('/api/v1/issues?status=open').expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach((issue: Issue) => {
        expect(issue.status).toBe('open');
      });
    });

    test('should filter issues by severity', async () => {
      const response = await request(app).get('/api/v1/issues?severity=major').expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach((issue: Issue) => {
        expect(issue.severity).toBe('major');
      });
    });

    test('should filter issues by site', async () => {
      const response = await request(app).get('/api/v1/issues?site=Site-101').expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach((issue: Issue) => {
        expect(issue.site).toBe('Site-101');
      });
    });

    test('should search issues by title', async () => {
      const response = await request(app).get('/api/v1/issues?search=consent').expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toContain('consent');
    });

    test('should sort issues by created_at desc by default', async () => {
      const response = await request(app).get('/api/v1/issues').expect(200);

      const dates = response.body.map((issue: Issue) => new Date(issue.createdAt as string));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1] >= dates[i]).toBeTruthy();
      }
    });

    test('should sort issues by specified field', async () => {
      const response = await request(app).get('/api/v1/issues?sort=title&order=asc').expect(200);

      const titles = response.body.map((issue: Issue) => issue.title);
      const sortedTitles = [...titles].sort();
      expect(titles).toEqual(sortedTitles);
    });

    test('should paginate results', async () => {
      const response = await request(app).get('/api/v1/issues?limit=2&page=1').expect(200);

      expect(response.body).toHaveLength(2);

      const response2 = await request(app).get('/api/v1/issues?limit=2&page=2').expect(200);

      expect(response2.body).toHaveLength(2);
      expect(response2.body[0].id).not.toBe(response.body[0].id);
    });

    test('should reject invalid query parameters', async () => {
      const response = await request(app).get('/api/v1/issues?status=invalid').expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details[0].field).toBe('status');
    });
  });

  describe('GET /api/v1/issues/:id', () => {
    test('should return issue by ID', async () => {
      const issueId = seededIssues[0]?.id;
      const response = await request(app)
        .get(`/api/v1/issues/${issueId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', issueId);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
    });

    test('should return 404 for non-existent issue', async () => {
      const response = await request(app).get('/api/v1/issues/9999').expect(404);

      expect(response.body.error).toBe('Not Found');
      expect(response.body.message).toBe('Issue not found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app).get('/api/v1/issues/abc').expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /api/v1/issues', () => {
    test('should create a new issue', async () => {
      const newIssue = createTestIssue({
        title: 'New Test Issue',
      });

      const response = await request(app)
        .post('/api/v1/issues')
        .send(newIssue)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newIssue.title);
      expect(response.body.description).toBe(newIssue.description);
      expect(response.body.status).toBe('open');
      expect(response.body).toHaveProperty('createdAt');
    });

    test('should create issue with custom status', async () => {
      const newIssue = createTestIssue({
        status: 'in_progress',
      });

      const response = await request(app).post('/api/v1/issues').send(newIssue).expect(201);

      expect(response.body.status).toBe('in_progress');
    });

    test('should reject issue with missing title', async () => {
      const response = await request(app)
        .post('/api/v1/issues')
        .send(invalidIssues.missingTitle)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details.some((d: any) => d.field === 'title')).toBeTruthy();
    });

    test('should reject issue with missing description', async () => {
      const response = await request(app)
        .post('/api/v1/issues')
        .send(invalidIssues.missingDescription)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details.some((d: any) => d.field === 'description')).toBeTruthy();
    });

    test('should reject issue with invalid severity', async () => {
      const response = await request(app)
        .post('/api/v1/issues')
        .send(invalidIssues.invalidSeverity)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details.some((d: any) => d.field === 'severity')).toBeTruthy();
    });

    test('should reject issue with invalid status', async () => {
      const response = await request(app)
        .post('/api/v1/issues')
        .send(invalidIssues.invalidStatus)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details.some((d: any) => d.field === 'status')).toBeTruthy();
    });

    test('should reject issue with empty fields', async () => {
      const response = await request(app)
        .post('/api/v1/issues')
        .send(invalidIssues.emptyFields)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    test('should trim whitespace from string fields', async () => {
      const issueWithSpaces = {
        title: '  Trimmed Title  ',
        description: '  Trimmed Description  ',
        site: '  Site-101  ',
        severity: '  major  ',
        status: '  open  ',
      };

      const response = await request(app).post('/api/v1/issues').send(issueWithSpaces).expect(201);

      expect(response.body.title).toBe('Trimmed Title');
      expect(response.body.description).toBe('Trimmed Description');
      expect(response.body.site).toBe('Site-101');
    });
  });

  describe('PUT /api/v1/issues/:id', () => {
    test('should update an existing issue', async () => {
      const issueId = seededIssues[0]?.id;
      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
        severity: 'critical' as const,
      };

      const response = await request(app)
        .put(`/api/v1/issues/${issueId}`)
        .send(updates)
        .expect(200);

      expect(response.body.id).toBe(issueId);
      expect(response.body.title).toBe(updates.title);
      expect(response.body.description).toBe(updates.description);
      expect(response.body.severity).toBe(updates.severity);
      expect(response.body.updatedAt).not.toBe(response.body.createdAt);
    });

    test('should update only provided fields', async () => {
      const issueId = seededIssues[0]?.id;
      const originalIssue = seededIssues[0];
      const updates = {
        title: 'Only Title Updated',
      };

      const response = await request(app)
        .put(`/api/v1/issues/${issueId}`)
        .send(updates)
        .expect(200);

      expect(response.body.title).toBe(updates.title);
      expect(response.body.description).toBe(originalIssue?.description);
      expect(response.body.severity).toBe(originalIssue?.severity);
    });

    test('should return 404 for non-existent issue', async () => {
      const updates = {
        title: 'Updated Title',
      };

      const response = await request(app).put('/api/v1/issues/9999').send(updates).expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    test('should reject invalid updates', async () => {
      const issueId = seededIssues[0]?.id;
      const invalidUpdates = {
        severity: 'invalid_severity',
      };

      const response = await request(app)
        .put(`/api/v1/issues/${issueId}`)
        .send(invalidUpdates)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    test('should handle empty update (no fields)', async () => {
      const issueId = seededIssues[0]?.id;

      const response = await request(app).put(`/api/v1/issues/${issueId}`).send({}).expect(200);

      expect(response.body.id).toBe(issueId);
    });
  });

  describe('DELETE /api/v1/issues/:id', () => {
    test('should delete an existing issue', async () => {
      const issueId = seededIssues[0]?.id;

      await request(app).delete(`/api/v1/issues/${issueId}`).expect(204);

      // Verify issue is deleted
      const getResponse = await request(app).get(`/api/v1/issues/${issueId}`).expect(404);

      expect(getResponse.body.error).toBe('Not Found');
    });

    test('should return 404 for non-existent issue', async () => {
      const response = await request(app).delete('/api/v1/issues/9999').expect(404);

      expect(response.body.error).toBe('Not Found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app).delete('/api/v1/issues/abc').expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('PATCH /api/v1/issues/:id/resolve', () => {
    test('should resolve an issue', async () => {
      const issueId = seededIssues[0]?.id;

      const response = await request(app).patch(`/api/v1/issues/${issueId}/resolve`).expect(200);

      expect(response.body.id).toBe(issueId);
      expect(response.body.status).toBe('resolved');
    });

    test('should resolve an already resolved issue', async () => {
      const resolvedIssue = seededIssues.find((i) => i.status === 'resolved');

      const response = await request(app)
        .patch(`/api/v1/issues/${resolvedIssue?.id}/resolve`)
        .expect(200);

      expect(response.body.status).toBe('resolved');
    });

    test('should return 404 for non-existent issue', async () => {
      const response = await request(app).patch('/api/v1/issues/9999/resolve').expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });
});
