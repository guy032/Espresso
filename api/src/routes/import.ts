import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import { IssueModel } from '../models/issue';
import type { Issue } from '../types/index';

const router = Router();

interface MulterRequest extends Request {
  file?: Express.Multer.File;
  fileValidationError?: string;
}

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req: MulterRequest, file, cb) => {
    // Check file extension
    if (file.mimetype !== 'text/csv' && !file.originalname.toLowerCase().endsWith('.csv')) {
      req.fileValidationError = 'Only CSV files are allowed';
      return cb(null, false);
    }
    cb(null, true);
  },
});

interface CsvRow {
  title?: string;
  description?: string;
  site?: string;
  severity?: string;
  status?: string;
  createdAt?: string;
}

// Helper function to validate CSV row
function validateRow(row: CsvRow, rowIndex: number): string[] {
  const errors: string[] = [];

  if (!row.title || (typeof row.title === 'string' && row.title.trim() === '')) {
    errors.push(`Row ${rowIndex}: Title is required`);
  }

  if (!row.description || (typeof row.description === 'string' && row.description.trim() === '')) {
    errors.push(`Row ${rowIndex}: Description is required`);
  }

  if (!row.site || (typeof row.site === 'string' && row.site.trim() === '')) {
    errors.push(`Row ${rowIndex}: Site is required`);
  }

  const validSeverities = ['minor', 'major', 'critical'];
  if (
    !row.severity ||
    (typeof row.severity === 'string' &&
      !validSeverities.includes(row.severity.trim().toLowerCase()))
  ) {
    errors.push(`Row ${rowIndex}: Severity must be minor, major, or critical`);
  }

  const validStatuses = ['open', 'in_progress', 'resolved'];
  if (
    row.status &&
    typeof row.status === 'string' &&
    !validStatuses.includes(row.status.trim().toLowerCase())
  ) {
    errors.push(`Row ${rowIndex}: Status must be open, in_progress, or resolved`);
  }

  return errors;
}

// POST /api/v1/import/csv - Import issues from CSV file
router.post(
  '/csv',
  upload.single('file'),
  async (req: MulterRequest, res: Response, next: NextFunction) => {
    const filePath = req.file ? req.file.path : null;

    try {
      // Check for file validation errors
      if (req.fileValidationError) {
        res.status(400).json({
          error: 'Bad Request',
          message: req.fileValidationError,
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'No file uploaded',
        });
        return;
      }

      const issues: Omit<Issue, 'id' | 'updatedAt'>[] = [];
      const errors: string[] = [];
      let rowIndex = 2; // Start from 2 (header is row 1)

      // Parse CSV file
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath!)
          .pipe(csv())
          .on('data', (row: CsvRow) => {
            // Validate row
            const rowErrors = validateRow(row, rowIndex);

            if (rowErrors.length > 0) {
              errors.push(...rowErrors);
            } else {
              // Normalize the data
              issues.push({
                title: row.title!.trim(),
                description: row.description!.trim(),
                site: row.site!.trim(),
                severity: row.severity!.trim().toLowerCase() as Issue['severity'],
                status: row.status ? (row.status.trim().toLowerCase() as Issue['status']) : 'open',
                createdAt: row.createdAt || undefined,
              });
            }

            rowIndex++;
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // If there are validation errors, return them
      if (errors.length > 0) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'CSV contains invalid data',
          details: errors,
        });
        return;
      }

      // If no issues found
      if (issues.length === 0) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'CSV file is empty or contains no valid data',
        });
        return;
      }

      // Bulk upsert issues (insert new, update existing based on title+site)
      const result = await IssueModel.bulkUpsert(issues);

      const message =
        result.updated.length > 0
          ? `CSV imported successfully: ${result.inserted.length} added, ${result.updated.length} updated`
          : `CSV imported successfully: ${result.inserted.length} added`;

      res.status(201).json({
        success: true,
        message,
        imported: result.inserted.length,
        updated: result.updated.length,
        skipped: 0,
        count: result.total,
        issues: [...result.inserted, ...result.updated],
      });
    } catch (error) {
      // Check for specific CSV parsing errors
      if (error instanceof Error && error.message?.includes('CSV')) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid CSV format',
        });
        return;
      }
      next(error);
    } finally {
      // Clean up uploaded file
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
);

export default router;
