import { Router, Request, Response, NextFunction } from 'express';
import { IssueModel } from '../models/issue';
import {
  validateCreateIssue,
  validateUpdateIssue,
  validateId,
  validateListQuery,
  handleValidationErrors,
} from '../middleware/validation';
import type { Issue, QueryFilters } from '../types/index';

const router = Router();

// GET /api/v1/issues - Get all issues with filters
router.get(
  '/',
  validateListQuery,
  handleValidationErrors,
  async (req: Request<{}, {}, {}, QueryFilters>, res: Response, next: NextFunction) => {
    try {
      const issues = await IssueModel.findAll(req.query);
      res.json(issues);
    } catch (error) {
      next(error);
    }
  },
);

// GET /api/v1/issues/:id - Get issue by ID
router.get(
  '/:id',
  validateId,
  handleValidationErrors,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const issue = await IssueModel.findById(parseInt(req.params.id));

      if (!issue) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Issue not found',
        });
        return;
      }

      res.json(issue);
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/v1/issues - Create new issue
router.post(
  '/',
  validateCreateIssue,
  handleValidationErrors,
  async (req: Request<{}, {}, Issue>, res: Response, next: NextFunction) => {
    try {
      const issue = await IssueModel.create(req.body);
      res.status(201).json(issue);
    } catch (error) {
      next(error);
    }
  },
);

// PUT /api/v1/issues/:id - Update issue
router.put(
  '/:id',
  validateId,
  validateUpdateIssue,
  handleValidationErrors,
  async (req: Request<{ id: string }, {}, Partial<Issue>>, res: Response, next: NextFunction) => {
    try {
      const issue = await IssueModel.update(parseInt(req.params.id), req.body);

      if (!issue) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Issue not found',
        });
        return;
      }

      res.json(issue);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/v1/issues/:id - Delete issue
router.delete(
  '/:id',
  validateId,
  handleValidationErrors,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const result = await IssueModel.delete(parseInt(req.params.id));

      if (!result) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Issue not found',
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

// PATCH /api/v1/issues/:id/resolve - Quick resolve
router.patch(
  '/:id/resolve',
  validateId,
  handleValidationErrors,
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const issue = await IssueModel.resolve(parseInt(req.params.id));

      if (!issue) {
        res.status(404).json({
          error: 'Not Found',
          message: 'Issue not found',
        });
        return;
      }

      res.json(issue);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
