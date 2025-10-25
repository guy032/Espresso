import { Request, Response } from 'express';
import type { ApiError } from '../types/index';

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    path: req.path,
    method: req.method,
  } as ApiError);
};
