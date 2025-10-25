import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { Application } from 'express';
import { createApp } from '../src/app';
import { cleanDatabase, closeDatabase } from './helpers/database';
import { validCsvContent, invalidCsvContent } from './helpers/testData';

const app: Application = createApp();

describe('Import API Endpoint', () => {
  const testFilesDir = path.join(__dirname, 'test-files');
  const validCsvPath = path.join(testFilesDir, 'valid.csv');
  const invalidCsvPath = path.join(testFilesDir, 'invalid.csv');
  const emptyCsvPath = path.join(testFilesDir, 'empty.csv');

  beforeAll(async () => {
    // Create test files directory
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }

    // Create test CSV files
    fs.writeFileSync(validCsvPath, validCsvContent);
    fs.writeFileSync(invalidCsvPath, invalidCsvContent);
    fs.writeFileSync(emptyCsvPath, 'title,description,site,severity,status\n');

    await cleanDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    // Clean up test files
    if (fs.existsSync(testFilesDir)) {
      fs.rmSync(testFilesDir, { recursive: true, force: true });
    }
    await closeDatabase();
  });

  describe('POST /api/v1/import/csv', () => {
    test('should import valid CSV file', async () => {
      const response = await request(app)
        .post('/api/v1/import/csv')
        .attach('file', validCsvPath)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.message).toBe('CSV imported successfully: 4 added');
      expect(response.body.count).toBe(4);
      expect(response.body.issues).toBeInstanceOf(Array);
      expect(response.body.issues).toHaveLength(4);

      // Verify issues were created correctly
      const firstIssue = response.body.issues[0];
      expect(firstIssue).toHaveProperty('id');
      expect(firstIssue.title).toBe('Missing consent form');
      expect(firstIssue.severity).toBe('major');
      expect(firstIssue.status).toBe('open');
    });

    test('should handle CSV without status column (default to open)', async () => {
      const csvWithoutStatus = `title,description,site,severity
Test Issue 1,Description 1,Site-101,minor
Test Issue 2,Description 2,Site-202,major`;

      const csvPath = path.join(testFilesDir, 'no-status.csv');
      fs.writeFileSync(csvPath, csvWithoutStatus);

      const response = await request(app)
        .post('/api/v1/import/csv')
        .attach('file', csvPath)
        .expect(201);

      expect(response.body.count).toBe(2);
      response.body.issues.forEach((issue: any) => {
        expect(issue.status).toBe('open');
      });
    });

    test('should reject CSV with missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/import/csv')
        .attach('file', invalidCsvPath)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.message).toBe('CSV contains invalid data');
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    test('should reject empty CSV file', async () => {
      const response = await request(app)
        .post('/api/v1/import/csv')
        .attach('file', emptyCsvPath)
        .expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('CSV file is empty or contains no valid data');
    });

    test('should reject non-CSV file', async () => {
      const txtPath = path.join(testFilesDir, 'test.txt');
      fs.writeFileSync(txtPath, 'This is not a CSV file');

      const response = await request(app)
        .post('/api/v1/import/csv')
        .attach('file', txtPath)
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    test('should reject request without file', async () => {
      const response = await request(app).post('/api/v1/import/csv').expect(400);

      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toBe('No file uploaded');
    });

    test('should handle CSV with mixed valid and invalid rows', async () => {
      const mixedCsv = `title,description,site,severity,status
Valid Issue,Valid description,Site-101,major,open
,Missing title,Site-102,minor,open
Another Valid,Another description,Site-103,critical,resolved`;

      const mixedPath = path.join(testFilesDir, 'mixed.csv');
      fs.writeFileSync(mixedPath, mixedCsv);

      const response = await request(app)
        .post('/api/v1/import/csv')
        .attach('file', mixedPath)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(
        response.body.details.some((d: string) => d.includes('Title is required')),
      ).toBeTruthy();
    });

    test('should handle large CSV file within size limit', async () => {
      // Create a CSV with many rows
      let largeCsv = 'title,description,site,severity,status\n';
      for (let i = 1; i <= 100; i++) {
        largeCsv += `Issue ${i},Description for issue ${i},Site-${i % 10},major,open\n`;
      }

      const largePath = path.join(testFilesDir, 'large.csv');
      fs.writeFileSync(largePath, largeCsv);

      const response = await request(app)
        .post('/api/v1/import/csv')
        .attach('file', largePath)
        .expect(201);

      expect(response.body.count).toBe(100);
      expect(response.body.issues).toHaveLength(100);
    });

    test('should normalize severity and status values', async () => {
      const csvWithCaps = `title,description,site,severity,status
Issue 1,Description 1,Site-101,MAJOR,OPEN
Issue 2,Description 2,Site-102,Minor,In_Progress
Issue 3,Description 3,Site-103,CriTicaL,Resolved`;

      const capsPath = path.join(testFilesDir, 'caps.csv');
      fs.writeFileSync(capsPath, csvWithCaps);

      const response = await request(app)
        .post('/api/v1/import/csv')
        .attach('file', capsPath)
        .expect(201);

      expect(response.body.count).toBe(3);
      expect(response.body.issues[0].severity).toBe('major');
      expect(response.body.issues[0].status).toBe('open');
      expect(response.body.issues[1].severity).toBe('minor');
      expect(response.body.issues[1].status).toBe('in_progress');
      expect(response.body.issues[2].severity).toBe('critical');
      expect(response.body.issues[2].status).toBe('resolved');
    });

    test('should handle CSV with extra columns', async () => {
      const csvWithExtra = `title,description,site,severity,status,extra1,extra2
Issue 1,Description 1,Site-101,major,open,ignored,data`;

      const extraPath = path.join(testFilesDir, 'extra.csv');
      fs.writeFileSync(extraPath, csvWithExtra);

      const response = await request(app)
        .post('/api/v1/import/csv')
        .attach('file', extraPath)
        .expect(201);

      expect(response.body.count).toBe(1);
      expect(response.body.issues[0]).not.toHaveProperty('extra1');
      expect(response.body.issues[0]).not.toHaveProperty('extra2');
    });

    test('should trim whitespace from CSV values', async () => {
      const csvWithSpaces = `title,description,site,severity,status
  Issue with spaces  ,  Description with spaces  ,  Site-101  ,  major  ,  open  `;

      const spacesPath = path.join(testFilesDir, 'spaces.csv');
      fs.writeFileSync(spacesPath, csvWithSpaces);

      const response = await request(app)
        .post('/api/v1/import/csv')
        .attach('file', spacesPath)
        .expect(201);

      expect(response.body.issues[0].title).toBe('Issue with spaces');
      expect(response.body.issues[0].description).toBe('Description with spaces');
      expect(response.body.issues[0].site).toBe('Site-101');
    });
  });
});
