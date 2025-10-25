import {
  body,
  param,
  query,
  validationResult,
  ValidationChain,
  ValidationError as ExpressValidationError,
} from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import type { ApiError, ValidationError } from '../types/index';

// Validation rules for creating an issue
export const validateCreateIssue: ValidationChain[] = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),

  body('description').trim().notEmpty().withMessage('Description is required'),

  body('site')
    .trim()
    .notEmpty()
    .withMessage('Site is required')
    .isLength({ max: 100 })
    .withMessage('Site must be less than 100 characters'),

  body('severity')
    .trim()
    .notEmpty()
    .withMessage('Severity is required')
    .isIn(['minor', 'major', 'critical'])
    .withMessage('Severity must be minor, major, or critical'),

  body('status')
    .optional()
    .trim()
    .isIn(['open', 'in_progress', 'resolved'])
    .withMessage('Status must be open, in_progress, or resolved'),
];

// Validation rules for updating an issue
export const validateUpdateIssue: ValidationChain[] = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),

  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),

  body('site')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Site cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Site must be less than 100 characters'),

  body('severity')
    .optional()
    .trim()
    .isIn(['minor', 'major', 'critical'])
    .withMessage('Severity must be minor, major, or critical'),

  body('status')
    .optional()
    .trim()
    .isIn(['open', 'in_progress', 'resolved'])
    .withMessage('Status must be open, in_progress, or resolved'),
];

// Validation for ID parameter
export const validateId: ValidationChain[] = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),
];

// Validation for query parameters (list filters)
export const validateListQuery: ValidationChain[] = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search term must be less than 255 characters'),

  query('status')
    .optional()
    .trim()
    .isIn(['open', 'in_progress', 'resolved'])
    .withMessage('Status must be open, in_progress, or resolved'),

  query('severity')
    .optional()
    .trim()
    .isIn(['minor', 'major', 'critical'])
    .withMessage('Severity must be minor, major, or critical'),

  query('site')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Site must be less than 100 characters'),

  query('sort')
    .optional()
    .trim()
    .isIn([
      'id',
      'title',
      'site',
      'severity',
      'status',
      'created_at',
      'updated_at',
      'createdAt',
      'updatedAt',
    ])
    .withMessage(
      'Sort field must be one of: id, title, site, severity, status, createdAt, updatedAt',
    ),

  query('order').optional().trim().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),

  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Middleware to check validation results
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors: ValidationError[] = errors
      .array()
      .map((err: ExpressValidationError) => ({
        field: (err as any).path || (err as any).param || 'unknown',
        message: err.msg,
        value: (err as any).value,
      }));

    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: formattedErrors,
    } as ApiError);
    return;
  }

  next();
};
