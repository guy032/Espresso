import { Request, Response, NextFunction } from 'express';
import type { ApiError } from '../types/index';

interface DatabaseError extends Error {
  code?: string;
}

interface MulterError extends Error {
  code?: string;
}

// Central error handling middleware
export const errorHandler = (
  err: Error | DatabaseError | MulterError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  const dbErr = err as DatabaseError;
  const multerErr = err as MulterError;

  // Database errors
  if (dbErr.code === '23505') {
    // Unique constraint violation
    res.status(409).json({
      error: 'Conflict',
      message: 'A record with this value already exists',
    } as ApiError);
    return;
  }

  if (dbErr.code === '23503') {
    // Foreign key violation
    res.status(400).json({
      error: 'Bad Request',
      message: 'Referenced record does not exist',
    } as ApiError);
    return;
  }

  if (dbErr.code === '22P02') {
    // Invalid text representation
    res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid input syntax',
    } as ApiError);
    return;
  }

  if (dbErr.code === 'ECONNREFUSED') {
    // Database connection error
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection failed',
    } as ApiError);
    return;
  }

  // Multer file upload errors
  if (multerErr.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({
      error: 'Payload Too Large',
      message: 'File size exceeds maximum allowed size',
    } as ApiError);
    return;
  }

  if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Unexpected file field',
    } as ApiError);
    return;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      message: err.message,
    } as ApiError);
    return;
  }

  // JWT errors (if implemented later)
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token',
    } as ApiError);
    return;
  }

  // Default error response
  const statusCode =
    (err as Error & { statusCode?: number }).statusCode ||
    (err as Error & { status?: number }).status ||
    500;
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : 'Error',
    message:
      process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'An unexpected error occurred'
        : message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  } as ApiError);
};
