import { Router, Request, Response, NextFunction } from 'express';
import { IssueModel } from '../models/issue';

const router = Router();

// GET /api/v1/dashboard - Get dashboard statistics
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const counts = await IssueModel.getCounts();
    res.json(counts);
  } catch (error) {
    next(error);
  }
});

export default router;
